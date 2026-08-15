using System;
using System.Collections.Generic;
using Fleck; // 가볍고 빠른 C# 웹소켓 라이브러리

namespace StockWars.Server
{
    class Program
    {
        static void Main(string[] args)
        {
            // 1. 8080번 포트에서 웹소켓 서버(Listener) 시작!
            var server = new WebSocketServer("ws://0.0.0.0:8080");
            var allSockets = new List<IWebSocketConnection>();

            server.Start(socket =>
            {
                // [이벤트 1] 유니티 클라이언트가 접속했을 때
                socket.OnOpen = () =>
                {
                    allSockets.Add(socket);
                    Console.WriteLine($"[서버] 새로운 유저 접속! (현재 접속자: {allSockets.Count}명)");
                };

                // [이벤트 2] 유니티 클라이언트가 접속을 끊었을 때
                socket.OnClose = () =>
                {
                    allSockets.Remove(socket);
                    Console.WriteLine($"[서버] 유저 접속 해제 (남은 접속자: {allSockets.Count}명)");
                };

                // [이벤트 3] 유니티에서 메시지(예: 주식 매수, 이동 좌표)를 보냈을 때
                socket.OnMessage = message =>
                {
                    Console.WriteLine($"[수신] 유저 메시지: {message}");

                    // 받은 메시지를 모든 접속자에게 똑같이 쏴주기 (브로드캐스팅)
                    foreach (var s in allSockets)
                    {
                        s.Send("서버 응답: " + message);
                    }
                };
            });

            Console.WriteLine("==================================================");
            Console.WriteLine("[StockWars 서버] 8080번 포트에서 웹소켓 대기 중...");
            Console.WriteLine("==================================================");
            Console.ReadLine(); // 서버 프로그램이 종료되지 않게 대기
        }
    }
}
