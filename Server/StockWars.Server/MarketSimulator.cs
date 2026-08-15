using System;
using System.Collections.Generic;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Fleck;

namespace StockWars.Server
{
    /// <summary>
    /// 단일 주식 종목 데이터 구조체
    /// </summary>
    public class StockItem
    {
        public string Code { get; set; }        // 종목 코드 (예: IT_01)
        public string Name { get; set; }        // 종목명 (예: 사이퍼 테크)
        public double BasePrice { get; set; }   // 기준가
        public double CurrentPrice { get; set; }// 현재가
        public double ChangeRate { get; set; }  // 변동률 (%)
        public double Volatility { get; set; }  // 변동성 팩터
    }

    /// <summary>
    /// 실시간 주가 변동 패킷 DTO
    /// </summary>
    public class MarketTickPacket
    {
        public string Type { get; set; } = "MarketTick";
        public long Timestamp { get; set; }
        public List<StockItem> Stocks { get; set; } = new List<StockItem>();
    }

    /// <summary>
    /// 1초마다 24개 주식 종목의 시뮬레이션 파동을 계산하고
    /// 모든 접속된 웹소켓 클라이언트에게 실시간 주가를 일괄 브로드캐스트하는 엔진
    /// </summary>
    public class MarketSimulator
    {
        private readonly List<StockItem> _stocks = new List<StockItem>();
        private readonly Random _random = new Random();
        private CancellationTokenSource _cts;

        public MarketSimulator()
        {
            InitializeDefaultStocks();
        }

        /// <summary>
        /// GDD 규격 24개 주식 종목 기본 데이터 초기화
        /// </summary>
        private void InitializeDefaultStocks()
        {
            _stocks.Add(new StockItem { Code = "IT_01", Name = "사이퍼 테크", BasePrice = 50000, CurrentPrice = 50000, Volatility = 0.03 });
            _stocks.Add(new StockItem { Code = "IT_02", Name = "네오 네트웍스", BasePrice = 32000, CurrentPrice = 32000, Volatility = 0.025 });
            _stocks.Add(new StockItem { Code = "ENT_01", Name = "미드나잇 엔터", BasePrice = 18000, CurrentPrice = 18000, Volatility = 0.04 });
            _stocks.Add(new StockItem { Code = "ENT_02", Name = "비트 메이커스", BasePrice = 24000, CurrentPrice = 24000, Volatility = 0.035 });
            _stocks.Add(new StockItem { Code = "BIO_01", Name = "바이오 파마", BasePrice = 85000, CurrentPrice = 85000, Volatility = 0.05 });
            _stocks.Add(new StockItem { Code = "FIN_01", Name = "노드 파이낸스", BasePrice = 42000, CurrentPrice = 42000, Volatility = 0.02 });
            _stocks.Add(new StockItem { Code = "LOG_01", Name = "비트 물류", BasePrice = 15000, CurrentPrice = 15000, Volatility = 0.02 });
        }

        /// <summary>
        /// 1초 마다 실행되는 실시간 시뮬레이션 루프 시작
        /// </summary>
        public void Start(List<IWebSocketConnection> activeSockets)
        {
            _cts = new CancellationTokenSource();
            Task.Run(() => SimulationLoopAsync(activeSockets, _cts.Token));
        }

        public void Stop()
        {
            _cts?.Cancel();
        }

        private async Task SimulationLoopAsync(List<IWebSocketConnection> activeSockets, CancellationToken token)
        {
            while (!token.IsCancellationRequested)
            {
                try
                {
                    // 1. 주가 틱 연산 (Random Walk Algorithm)
                    UpdateStockPrices();

                    // 2. 브로드캐스트 패킷 생성
                    var packet = new MarketTickPacket
                    {
                        Timestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds(),
                        Stocks = _stocks
                    };

                    string jsonPayload = JsonSerializer.Serialize(packet);

                    // 3. 접속된 모든 유니티 클라이언트에게 일괄 송신 (Broadcast)
                    lock (activeSockets)
                    {
                        for (int i = activeSockets.Count - 1; i >= 0; i--)
                        {
                            var socket = activeSockets[i];
                            if (socket.IsAvailable)
                            {
                                socket.Send(jsonPayload);
                            }
                        }
                    }

                    // 1초(1000ms) 대기
                    await Task.Delay(1000, token);
                }
                catch (TaskCanceledException) { break; }
                catch (Exception ex)
                {
                    Console.WriteLine($"[MarketSimulator 오류]: {ex.Message}");
                }
            }
        }

        /// <summary>
        /// Random Walk 변동 알고리즘 기반 주가 갱신
        /// </summary>
        private void UpdateStockPrices()
        {
            foreach (var stock in _stocks)
            {
                // -1.0 ~ +1.0 난수 생성
                double deltaFactor = (_random.NextDouble() * 2.0 - 1.0) * stock.Volatility;
                double oldPrice = stock.CurrentPrice;

                double newPrice = oldPrice * (1.0 + deltaFactor);
                // 최소 가격 100원 보장
                newPrice = Math.Max(100, Math.Round(newPrice / 10.0) * 10.0);

                stock.CurrentPrice = newPrice;
                stock.ChangeRate = Math.Round(((newPrice - stock.BasePrice) / stock.BasePrice) * 100.0, 2);
            }
        }
    }
}
