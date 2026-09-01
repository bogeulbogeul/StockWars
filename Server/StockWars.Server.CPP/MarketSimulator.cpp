#define _CRT_SECURE_NO_WARNINGS

#include "MarketSimulator.h"
#include <iostream>
#include <sstream>
#include <iomanip>
#include <cmath>
#include <algorithm>

namespace StockWarsServer
{
    MarketSimulator::MarketSimulator()
    {
        auto seed = static_cast<unsigned int>(std::chrono::system_clock::now().time_since_epoch().count());
        m_rng.seed(seed);

        InitializeDefaultStocks();
    }

    void MarketSimulator::InitializeDefaultStocks()
    {
        std::lock_guard<std::mutex> lock(m_mutex);

        m_stocks.push_back({ "IT_01", "사이퍼 테크", 50000.0, 50000.0, 0.0, 0.03 });
        m_stocks.push_back({ "IT_02", "네오 네트웍스", 32000.0, 32000.0, 0.0, 0.025 });
        m_stocks.push_back({ "ENT_01", "미드나잇 엔터", 18000.0, 18000.0, 0.0, 0.04 });
        m_stocks.push_back({ "ENT_02", "비트 메이커스", 24000.0, 24000.0, 0.0, 0.035 });
        m_stocks.push_back({ "BIO_01", "바이오 파마", 85000.0, 85000.0, 0.0, 0.05 });
        m_stocks.push_back({ "FIN_01", "노드 파이낸스", 42000.0, 42000.0, 0.0, 0.02 });
        m_stocks.push_back({ "LOG_01", "비트 물류", 15000.0, 15000.0, 0.0, 0.02 });
    }

    void MarketSimulator::UpdateStockPrices()
    {
        std::lock_guard<std::mutex> lock(m_mutex);

        std::uniform_real_distribution<double> dist(-1.0, 1.0);

        for (auto& stock : m_stocks)
        {
            double deltaFactor = dist(m_rng) * stock.volatility;
            double oldPrice = stock.currentPrice;

            double newPrice = oldPrice * (1.0 + deltaFactor);
            newPrice = (std::max)(100.0, std::round(newPrice / 10.0) * 10.0);

            stock.currentPrice = newPrice;
            stock.changeRate = std::round(((newPrice - stock.basePrice) / stock.basePrice) * 10000.0) / 100.0;
        }
    }

    std::string MarketSimulator::GenerateMarketTickJson()
    {
        std::lock_guard<std::mutex> lock(m_mutex);

        std::ostringstream oss;
        oss << std::fixed << std::setprecision(2);

        oss << "{\"Type\":\"MarketTick\",\"Timestamp\":"
            << std::chrono::duration_cast<std::chrono::milliseconds>(
                std::chrono::system_clock::now().time_since_epoch()).count()
            << ",\"Stocks\":[";

        for (size_t i = 0; i < m_stocks.size(); ++i)
        {
            const auto& s = m_stocks[i];
            oss << "{\"Code\":\"" << s.code
                << "\",\"Name\":\"" << s.name
                << "\",\"BasePrice\":" << s.basePrice
                << ",\"CurrentPrice\":" << s.currentPrice
                << ",\"ChangeRate\":" << s.changeRate << "}";

            if (i + 1 < m_stocks.size())
            {
                oss << ",";
            }
        }

        oss << "]}";
        return oss.str();
    }

    // =========================================================================
    // [C++ 오더북 체결 엔진 구현]
    // 유니티 클라이언트가 요청한 매수/매도 수량 및 단가를 기반으로 거래를 정산합니다.
    // =========================================================================
    OrderResult MarketSimulator::ProcessOrder(const std::string& orderType, const std::string& stockCode, int quantity, double price)
    {
        std::lock_guard<std::mutex> lock(m_mutex);

        OrderResult result;
        result.orderType = orderType;
        result.stockCode = stockCode;
        result.quantity = quantity;

        // 1. 종목 코드 탐색 (C++ std::find_if)
        auto it = std::find_if(m_stocks.begin(), m_stocks.end(), [&stockCode](const StockItem& item) {
            return item.code == stockCode;
        });

        if (it == m_stocks.end())
        {
            // 유니티 클라이언트에서 상장 종목(예: VISUALART, CLOUDBERRY) 주문 시 C++ 서버 런타임 동적 등록 처리
            StockItem newItem;
            newItem.code = stockCode;
            
            if (stockCode == "VISUALART") newItem.name = "비주얼 아트";
            else if (stockCode == "AQUAENERGY") newItem.name = "아쿠아 에너지";
            else if (stockCode == "CLOUDBERRY") newItem.name = "클라우드 베리";
            else if (stockCode == "SYNAPSENET") newItem.name = "시냅스 망";
            else if (stockCode == "STARDUST") newItem.name = "스타더스트";
            else if (stockCode == "SCONNECT") newItem.name = "S-커넥트";
            else if (stockCode == "FORESTLAB") newItem.name = "포레스트 랩";
            else if (stockCode == "WINGSLOGIS") newItem.name = "윙스 로지스";
            else if (stockCode == "MORNINGBREW") newItem.name = "모닝 브루";
            else if (stockCode == "WINDHILL") newItem.name = "윈드 힐";
            else if (stockCode == "COZYPAY") newItem.name = "코지 페이";
            else newItem.name = stockCode;

            newItem.basePrice = (price > 0.0) ? price : 500.0;
            newItem.currentPrice = newItem.basePrice;
            newItem.changeRate = 0.0;
            newItem.volatility = 0.03;

            m_stocks.push_back(newItem);
            it = m_stocks.end() - 1;
        }

        const StockItem& stock = *it;
        result.stockName = stock.name;
        result.price = (price > 0.0) ? price : stock.currentPrice;
        result.totalCost = result.price * quantity;

        if (quantity <= 0)
        {
            result.success = false;
            result.message = "주문 수량이 올바르지 않습니다.";
            return result;
        }

        result.success = true;
        if (orderType == "BuyOrder")
        {
            std::ostringstream msg;
            msg << stock.name << " (" << stock.code << ") " << quantity << "주 매수 체결 완료! (단가: " << static_cast<long>(result.price) << "G)";
            result.message = msg.str();
        }
        else
        {
            std::ostringstream msg;
            msg << stock.name << " (" << stock.code << ") " << quantity << "주 매도 체결 완료! (단가: " << static_cast<long>(result.price) << "G)";
            result.message = msg.str();
        }

        return result;
    }

    std::string MarketSimulator::OrderResultToJson(const OrderResult& result)
    {
        std::ostringstream oss;
        oss << "{\"Type\":\"OrderResult\","
            << "\"Success\":" << (result.success ? "true" : "false") << ","
            << "\"OrderType\":\"" << result.orderType << "\","
            << "\"StockCode\":\"" << result.stockCode << "\","
            << "\"StockName\":\"" << result.stockName << "\","
            << "\"Quantity\":" << result.quantity << ","
            << "\"Price\":" << static_cast<long>(result.price) << ","
            << "\"TotalCost\":" << static_cast<long>(result.totalCost) << ","
            << "\"Message\":\"" << result.message << "\"}";

        return oss.str();
    }
}
