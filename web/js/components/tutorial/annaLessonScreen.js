// Restore only presentation state; never replay lesson actions or rewards.
export function annaLessonScreen(step, steps) {
    if (step.id === 'put_phone_away') return { phone: 'Stock', tab: 'News' };
    if (step.id === 'trade_screen_overview') return { phone: 'Stock', tab: 'Market', trade: true };
    const index = steps.findIndex(entry => entry.id === step.id);
    const at = id => steps.findIndex(entry => entry.id === id);
    const between = (start, end) => index >= at(start) && at(start) >= 0 && index < at(end);
    if (step.appIntroTarget || step.id === 'launch_stock_app') return { phone: 'Home' };
    if (step.htsIntroTarget || step.id === 'market_tab' || step.id === 'hts_home_overview') return { phone: 'Stock', tab: 'Home' };
    if (between('stock_basics_ownership', 'stock_basics_price')) return { phone: 'Stock', tab: 'Market' };
    if (between('stock_basics_price', 'portfolio_guide')) return { phone: 'Stock', tab: 'Market', trade: true };
    if (step.id === 'portfolio_guide') return { phone: 'Stock', tab: 'Market' };
    if (between('portfolio_guide', 'news_tab_guide')) return { phone: 'Stock', tab: 'Profile' };
    if (step.id === 'news_tab_guide') return { phone: 'Stock', tab: 'Profile' };
    if (between('news_reading_guide', 'put_phone_away')) return { phone: 'Stock', tab: 'News' };
    return { phone: null };
}
