using System;
using System.Collections.Generic;
using Fleck;

namespace StockWars.Server
{
    class Program
    {
        static void Main(string[] args)
        {
            var server = new WebSocketServer("ws://127.0.0.1:8080");
            var allSockets = new List<IWebSocketConnection>();

            // 1초 실시간 주가 시뮬레이터 엔진 시작
            var marketSimulator = new MarketSimulator();
            marketSimulator.Start(allSockets);

            server.Start(socket =>
            {
                socket.OnOpen = () =>
                {
                    lock (allSockets)
                    {
                        allSockets.Add(socket);
                    }
                    Console.WriteLine($"[서버] 유저 접속! (현재 동접: {allSockets.Count}명)");
                };

                socket.OnClose = () =>
                {
                    lock (allSockets)
                    {
                        allSockets.Remove(socket);
                    }
                    Console.WriteLine($"[서버] 유저 퇴장 (남은 동접: {allSockets.Count}명)");
                };

                socket.OnMessage = message =>
                {
                    Console.WriteLine($"[수신 패킷]: {message}");
                };
            });

            Console.WriteLine("==================================================");
            Console.WriteLine("[StockWars C# 서버] 8080 포트에서 가동 중...");
            Console.WriteLine("[시뮬레이터] 1초 실시간 주가 틱 브로드캐스트 시작!");
            Console.WriteLine("==================================================");
            Console.ReadLine();

            marketSimulator.Stop();
        }
    }
}
