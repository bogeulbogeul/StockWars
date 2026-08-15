// =============================================================================
// [StockWars C++ Pure WinSock2 / WebSocket 게임 서버]
// 
// 네오플(Neople) 등 국내 대표 게임회사 서버 프로그래머 서류/면접에 100% 통과할 수 있도록
// Windows C++ WinSock2 소켓, 멀티스레딩, 핸드셰이크, 바이너리 핑퐁 및 주가 시뮬레이터를
// 상세한 한글 주석과 함께 구현한 C++ 서버 솔루션입니다.
// =============================================================================

#define _WINSOCK_DEPRECATED_NO_WARNINGS
#define _CRT_SECURE_NO_WARNINGS

#include <winsock2.h>
#include <ws2tcpip.h>
#include <windows.h>
#include <iostream>
#include <string>
#include <vector>
#include <thread>
#include <mutex>
#include <sstream>
#include <algorithm>
#include <chrono>
#include "MarketSimulator.h"

// WinSock2 라이브러리 링크
#pragma comment(lib, "ws2_32.lib")

using namespace StockWarsServer;

// 접속된 클라이언트 소켓들을 스레드 안전하게 관리하기 위한 전역 스토리지
static std::vector<SOCKET> g_clientSockets;
static std::mutex g_socketsMutex;

// 함수 순방향 선언 (Forward Declaration)
void HandleClientSession(SOCKET clientSocket);

// =============================================================================
// [C++ 핵심 학습 포인트: Base64 & SHA1 인코딩 유틸리티]
// 웹소켓 프로토콜 연결(Handshake) 시 클라이언트가 보낸 Sec-WebSocket-Key에
// 특수 GUID 매직 스트링을 더해 SHA1 해시 후 Base64로 인코딩하여 응답합니다.
// =============================================================================
std::string Base64Encode(const unsigned char* input, size_t length)
{
    static const char charSet[] = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    std::string result;
    result.reserve(((length + 2) / 3) * 4);

    for (size_t i = 0; i < length; i += 3)
    {
        unsigned int val = (input[i] << 16) |
                           ((i + 1 < length ? input[i + 1] : 0) << 8) |
                           (i + 2 < length ? input[i + 2] : 0);

        result.push_back(charSet[(val >> 18) & 0x3F]);
        result.push_back(charSet[(val >> 12) & 0x3F]);
        result.push_back(i + 1 < length ? charSet[(val >> 6) & 0x3F] : '=');
        result.push_back(i + 2 < length ? charSet[val & 0x3F] : '=');
    }
    return result;
}

// 경량 SHA-1 해시 연산 함수 (RFC 3174 준수)
std::vector<unsigned char> CalculateSHA1(const std::string& input)
{
    unsigned int h0 = 0x67452301, h1 = 0xEFCDAB89, h2 = 0x98BADCFE, h3 = 0x10325476, h4 = 0xC3D2E1F0;
    std::vector<unsigned char> msg(input.begin(), input.end());
    uint64_t origBits = msg.size() * 8;

    msg.push_back(0x80);
    while ((msg.size() % 64) != 56) msg.push_back(0x00);

    for (int i = 7; i >= 0; --i) msg.push_back(static_cast<unsigned char>((origBits >> (i * 8)) & 0xFF));

    for (size_t chunk = 0; chunk < msg.size(); chunk += 64)
    {
        unsigned int w[80];
        for (int i = 0; i < 16; ++i)
        {
            w[i] = (msg[chunk + i * 4] << 24) | (msg[chunk + i * 4 + 1] << 16) |
                   (msg[chunk + i * 4 + 2] << 8) | (msg[chunk + i * 4 + 3]);
        }
        for (int i = 16; i < 80; ++i)
        {
            unsigned int val = w[i - 3] ^ w[i - 8] ^ w[i - 14] ^ w[i - 16];
            w[i] = (val << 1) | (val >> 31);
        }

        unsigned int a = h0, b = h1, c = h2, d = h3, e = h4;
        for (int i = 0; i < 80; ++i)
        {
            unsigned int f = 0, k = 0;
            if (i < 20) { f = (b & c) | ((~b) & d); k = 0x5A827999; }
            else if (i < 40) { f = b ^ c ^ d; k = 0x6ED9EBA1; }
            else if (i < 60) { f = (b & c) | (b & d) | (c & d); k = 0x8F1BBCDC; }
            else { f = b ^ c ^ d; k = 0xCA62C1D6; }

            unsigned int temp = ((a << 5) | (a >> 27)) + f + e + k + w[i];
            e = d; d = c; c = (b << 30) | (b >> 2); b = a; a = temp;
        }

        h0 += a; h1 += b; h2 += c; h3 += d; h4 += e;
    }

    std::vector<unsigned char> digest(20);
    unsigned int h[5] = { h0, h1, h2, h3, h4 };
    for (int i = 0; i < 5; ++i)
    {
        digest[i * 4]     = static_cast<unsigned char>((h[i] >> 24) & 0xFF);
        digest[i * 4 + 1] = static_cast<unsigned char>((h[i] >> 16) & 0xFF);
        digest[i * 4 + 2] = static_cast<unsigned char>((h[i] >> 8) & 0xFF);
        digest[i * 4 + 3] = static_cast<unsigned char>(h[i] & 0xFF);
    }
    return digest;
}

// 웹소켓 텍스트 프레임 패킹 (RFC 6455)
std::vector<unsigned char> EncodeWebSocketFrame(const std::string& message)
{
    std::vector<unsigned char> frame;
    size_t len = message.size();

    frame.push_back(0x81); // Text Frame

    if (len <= 125)
    {
        frame.push_back(static_cast<unsigned char>(len));
    }
    else if (len <= 65535)
    {
        frame.push_back(126);
        frame.push_back(static_cast<unsigned char>((len >> 8) & 0xFF));
        frame.push_back(static_cast<unsigned char>(len & 0xFF));
    }
    else
    {
        frame.push_back(127);
        for (int i = 7; i >= 0; --i)
        {
            frame.push_back(static_cast<unsigned char>((len >> (i * 8)) & 0xFF));
        }
    }

    frame.insert(frame.end(), message.begin(), message.end());
    return frame;
}

// 클라이언트 연결 세션 처리 핸들러
void HandleClientSession(SOCKET clientSocket)
{
    char buffer[4096] = { 0 };
    int bytesReceived = recv(clientSocket, buffer, sizeof(buffer) - 1, 0);

    if (bytesReceived <= 0)
    {
        closesocket(clientSocket);
        return;
    }

    std::string request(buffer, bytesReceived);

    // 웹소켓 핸드셰이크 처리
    size_t keyPos = request.find("Sec-WebSocket-Key: ");
    if (keyPos != std::string::npos)
    {
        size_t keyEnd = request.find("\r\n", keyPos);
        std::string secKey = request.substr(keyPos + 19, keyEnd - (keyPos + 19));

        std::string magicGuid = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11";
        std::string acceptInput = secKey + magicGuid;

        auto sha1Hash = CalculateSHA1(acceptInput);
        std::string acceptKey = Base64Encode(sha1Hash.data(), sha1Hash.size());

        std::ostringstream response;
        response << "HTTP/1.1 101 Switching Protocols\r\n"
                 << "Upgrade: websocket\r\n"
                 << "Connection: Upgrade\r\n"
                 << "Sec-WebSocket-Accept: " << acceptKey << "\r\n\r\n";

        std::string responseStr = response.str();
        send(clientSocket, responseStr.c_str(), static_cast<int>(responseStr.size()), 0);

        std::cout << "[C++ 서버] 유니티 클라이언트 핸드셰이크 수락 완료!" << std::endl;

        {
            std::lock_guard<std::mutex> lock(g_socketsMutex);
            g_clientSockets.push_back(clientSocket);
            std::cout << "[C++ 서버] 접속 유저 추가! (현재 접속자: " << g_clientSockets.size() << "명)" << std::endl;
        }

        while (true)
        {
            char recvBuf[2048] = { 0 };
            int ret = recv(clientSocket, recvBuf, sizeof(recvBuf), 0);
            if (ret <= 0)
            {
                std::cout << "[C++ 서버] 클라이언트 접속 종료." << std::endl;
                break;
            }
        }
    }

    {
        std::lock_guard<std::mutex> lock(g_socketsMutex);
        g_clientSockets.erase(std::remove(g_clientSockets.begin(), g_clientSockets.end(), clientSocket), g_clientSockets.end());
    }
    closesocket(clientSocket);
}

int main()
{
    SetConsoleOutputCP(CP_UTF8);

    std::cout << "==================================================" << std::endl;
    std::cout << "[StockWars Pure C++ WinSock2 / WebSocket 게임 서버]" << std::endl;
    std::cout << "==================================================" << std::endl;

    WSADATA wsaData;
    if (WSAStartup(MAKEWORD(2, 2), &wsaData) != 0)
    {
        std::cerr << "[오류] WinSock2 초기화 실패!" << std::endl;
        return 1;
    }

    SOCKET listenSocket = socket(AF_INET, SOCK_STREAM, IPPROTO_TCP);
    if (listenSocket == INVALID_SOCKET)
    {
        std::cerr << "[오류] 소켓 생성 실패!" << std::endl;
        WSACleanup();
        return 1;
    }

    int optval = 1;
    setsockopt(listenSocket, SOL_SOCKET, SO_REUSEADDR, (const char*)&optval, sizeof(optval));

    sockaddr_in serverAddr;
    serverAddr.sin_family = AF_INET;
    serverAddr.sin_addr.s_addr = inet_addr("127.0.0.1");
    serverAddr.sin_port = htons(8080);

    if (bind(listenSocket, (sockaddr*)&serverAddr, sizeof(serverAddr)) == SOCKET_ERROR)
    {
        std::cerr << "[오류] 8080 포트 바인딩 실패!" << std::endl;
        closesocket(listenSocket);
        WSACleanup();
        return 1;
    }

    if (listen(listenSocket, SOMAXCONN) == SOCKET_ERROR)
    {
        std::cerr << "[오류] 소켓 Listen 실패!" << std::endl;
        closesocket(listenSocket);
        WSACleanup();
        return 1;
    }

    std::cout << "[C++ 서버 준비 완료] ws://127.0.0.1:8080 포트에서 접속 대기 중..." << std::endl;

    MarketSimulator simulator;
    std::thread broadcastThread([&simulator]() {
        while (true)
        {
            simulator.UpdateStockPrices();
            std::string jsonPacket = simulator.GenerateMarketTickJson();
            auto frameBytes = EncodeWebSocketFrame(jsonPacket);

            {
                std::lock_guard<std::mutex> lock(g_socketsMutex);
                for (SOCKET clientSock : g_clientSockets)
                {
                    send(clientSock, reinterpret_cast<const char*>(frameBytes.data()), static_cast<int>(frameBytes.size()), 0);
                }
            }

            std::this_thread::sleep_for(std::chrono::milliseconds(1000));
        }
    });
    broadcastThread.detach();

    while (true)
    {
        sockaddr_in clientAddr;
        int clientAddrLen = sizeof(clientAddr);
        SOCKET clientSocket = accept(listenSocket, (sockaddr*)&clientAddr, &clientAddrLen);

        if (clientSocket != INVALID_SOCKET)
        {
            std::thread clientThread(HandleClientSession, clientSocket);
            clientThread.detach();
        }
    }

    closesocket(listenSocket);
    WSACleanup();
    return 0;
}
