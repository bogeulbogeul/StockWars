using System;
using System.Collections.Generic;
using System.Net.WebSockets;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using UnityEngine;

namespace StockWars.Network
{
    [Serializable]
    public class StockData
    {
        public string Code;
        public string Name;
        public double BasePrice;
        public double CurrentPrice;
        public double ChangeRate;
    }

    [Serializable]
    public class MarketTickPacketData
    {
        public string Type;
        public long Timestamp;
        public List<StockData> Stocks;
    }

    [Serializable]
    public class OrderResultData
    {
        public string Type;
        public bool Success;
        public string OrderType;
        public string StockCode;
        public string StockName;
        public int Quantity;
        public long Price;
        public long TotalCost;
        public string Message;
    }

    /// <summary>
    /// C# / C++ 서버(ws://127.0.0.1:8080) 연결 및 실시간 1초 주가 틱/체결 이벤트를 수신하는 유니티 네트워크 매니저
    /// </summary>
    public class StockWarsNetworkClient : MonoBehaviour
    {
        public static StockWarsNetworkClient Instance { get; private set; }

        [Header("서버 연결 설정")]
        [SerializeField] private string _serverUrl = "ws://127.0.0.1:8080";
        [SerializeField] private bool _autoConnectOnStart = true;

        private ClientWebSocket _webSocket;
        private CancellationTokenSource _cts;

        /// <summary>
        /// 1초 마다 서버에서 실시간 주가 틱이 날아올 때 발생하는 전역 이벤트
        /// </summary>
        public event Action<List<StockData>> OnMarketTickReceived;

        /// <summary>
        /// C++ 서버에서 매수/매도 체결 결과가 날아올 때 발생하는 전역 이벤트
        /// </summary>
        public event Action<OrderResultData> OnOrderResultReceived;

        public bool IsConnected => _webSocket != null && _webSocket.State == WebSocketState.Open;

        private void Awake()
        {
            if (Instance == null) Instance = this;
            else Destroy(gameObject);
        }

        private async void Start()
        {
            if (_autoConnectOnStart)
            {
                await ConnectToServerAsync();
            }
        }

        public async Task ConnectToServerAsync()
        {
            if (IsConnected) return;

            try
            {
                _webSocket = new ClientWebSocket();
                _cts = new CancellationTokenSource();

                // 윈도우 환경에서 localhost가 IPv6(::1)로 우회되는 현상을 강제로 127.0.0.1 IPv4로 보정
                string targetUrl = _serverUrl.Replace("localhost", "127.0.0.1").Trim();
                if (!targetUrl.EndsWith("/")) targetUrl += "/";

                Debug.Log($"[NetworkClient] C++ 서버 접속 시도 중... ({targetUrl})");
                await _webSocket.ConnectAsync(new Uri(targetUrl), _cts.Token);

                Debug.Log("<color=#4CAF50><b>[NetworkClient] C++ 서버 접속 성공!</b></color>");

                await SendMessageAsync("Hello Server! I am Unity Client!");
                _ = ReceiveLoopAsync();
            }
            catch (Exception ex)
            {
                Debug.LogError($"[NetworkClient] 서버 접속 실패: {ex.Message}");
            }
        }

        /// <summary>
        /// C++ 서버로 주식 매수/매도 체결 요청 패킷 발송
        /// </summary>
        public async Task SendOrderRequestAsync(bool isBuy, string stockCode, int quantity, long price)
        {
            if (!IsConnected)
            {
                Debug.LogWarning("[NetworkClient] C++ 서버에 연결되어 있지 않아 주문을 송신할 수 없습니다.");
                return;
            }

            string orderType = isBuy ? "BuyOrder" : "SellOrder";
            string orderJson = $"{{\"Type\":\"{orderType}\",\"StockCode\":\"{stockCode}\",\"Quantity\":{quantity},\"Price\":{price}}}";

            Debug.Log($"<color=#FFD700>[NetworkClient -> C++ Server 주문 송신]:</color> {orderJson}");
            await SendMessageAsync(orderJson);
        }

        public async Task SendMessageAsync(string message)
        {
            if (!IsConnected) return;

            try
            {
                byte[] bytes = Encoding.UTF8.GetBytes(message);
                ArraySegment<byte> buffer = new ArraySegment<byte>(bytes);

                await _webSocket.SendAsync(buffer, WebSocketMessageType.Text, true, _cts.Token);
            }
            catch (Exception ex)
            {
                Debug.LogError($"[NetworkClient] 메시지 송신 오류: {ex.Message}");
            }
        }

        private async Task ReceiveLoopAsync()
        {
            byte[] buffer = new byte[8192];

            while (IsConnected && !_cts.IsCancellationRequested)
            {
                try
                {
                    WebSocketReceiveResult result = await _webSocket.ReceiveAsync(new ArraySegment<byte>(buffer), _cts.Token);

                    if (result.MessageType == WebSocketMessageType.Close)
                    {
                        await _webSocket.CloseAsync(WebSocketCloseStatus.NormalClosure, "Closed by server", _cts.Token);
                        break;
                    }

                    string jsonMessage = Encoding.UTF8.GetString(buffer, 0, result.Count);
                    ProcessReceivedJsonMessage(jsonMessage);
                }
                catch (Exception ex)
                {
                    if (_cts?.IsCancellationRequested == true) break;
                    Debug.LogWarning($"[NetworkClient] 수신 예외: {ex.Message}");
                    break;
                }
            }
        }

        /// <summary>
        /// 서버에서 전달된 JSON 패킷 파싱 및 처리
        /// </summary>
        private void ProcessReceivedJsonMessage(string json)
        {
            try
            {
                if (json.Contains("\"Type\":\"MarketTick\""))
                {
                    MarketTickPacketData tickData = JsonUtility.FromJson<MarketTickPacketData>(json);
                    if (tickData != null && tickData.Stocks != null)
                    {
                        OnMarketTickReceived?.Invoke(tickData.Stocks);
                    }
                }
                else if (json.Contains("\"Type\":\"OrderResult\""))
                {
                    OrderResultData orderResult = JsonUtility.FromJson<OrderResultData>(json);
                    if (orderResult != null)
                    {
                        Debug.Log($"<color=#00FF7F><b>[C++ 서버 체결 결과 수신]:</b></color> {orderResult.Message}");
                        OnOrderResultReceived?.Invoke(orderResult);
                    }
                }
                else
                {
                    Debug.Log($"[Server -> Unity 수신]: {json}");
                }
            }
            catch (Exception ex)
            {
                Debug.LogWarning($"[NetworkClient] JSON 파싱 오류: {ex.Message}");
            }
        }

        private async void OnDestroy()
        {
            await DisconnectAsync();
        }

        public async Task DisconnectAsync()
        {
            if (_cts != null) _cts.Cancel();
            if (_webSocket != null)
            {
                if (_webSocket.State == WebSocketState.Open)
                {
                    await _webSocket.CloseAsync(WebSocketCloseStatus.NormalClosure, "Client shutting down", CancellationToken.None);
                }
                _webSocket.Dispose();
                _webSocket = null;
            }
        }
    }
}
