cmake_minimum_required(VERSION 3.16)
project(StockWarsServerCPP CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

add_executable(StockWarsServerCPP
    main.cpp
    MarketSimulator.h
    MarketSimulator.cpp
)

if(WIN32)
    target_link_libraries(StockWarsServerCPP PRIVATE ws2_32)
endif()
