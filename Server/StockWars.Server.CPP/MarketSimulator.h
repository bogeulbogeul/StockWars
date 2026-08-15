#pragma once
#include <string>
#include <vector>
#include <random>
#include <mutex>
#include <chrono>

namespace StockWarsServer
{
    // =========================================================================
    // [C++ 핵심 학습 포인트 1: 구조체(Struct)와 메모리 배치]
    // C++에서 struct는 기본 접근자가 public인 클래스입니다.
    // 주식 종목 하나의 기본 정보 및 현재 가격 데이터를 보관합니다.
    // =========================================================================
    struct StockItem
    {
        std::string code;         // 종목 코드 (예: "IT_01")
        std::string name;         // 종목명 (예: "사이퍼 테크")
        double basePrice;        // 기준가
        double currentPrice;     // 현재가
        double changeRate;       // 등락률 (%)
        double volatility;       // 변동성 파동 팩터 (예: 0.03 = 3%)
    };

    // =========================================================================
    // [C++ 핵심 학습 포인트 2: 클래스(Class)와 캡슐화]
    // 1초 마다 24개 주식 종목의 가격 파동을 계산하는 C++ 주가 시뮬레이터 엔진
    // =========================================================================
    class MarketSimulator
    {
    private:
        std::vector<StockItem> m_stocks;     // C++ 동적 배열 (std::vector)
        std::mt19937 m_rng;                  // Modern C++ 난수 생성기 (Mersenne Twister)
        std::mutex m_mutex;                  // 멀티스레드 동기화용 뮤텍스 (자원 보호)

    public:
        MarketSimulator();
        ~MarketSimulator() = default;

        // GDD 규격 기본 종목 데이터 세팅
        void InitializeDefaultStocks();

        // 1초 주가 변동 틱(Tick) 연산 갱신
        void UpdateStockPrices();

        // 현재 주가 데이터를 JSON 패킷 문자열로 직렬화 (Serialize)
        std::string GenerateMarketTickJson();
    };
}
