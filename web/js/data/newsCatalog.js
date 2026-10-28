import { IT_NEWS } from './news/IT.js';
import { ENTERTAINMENT_NEWS } from './news/Entertainment.js';
import { INFRASTRUCTURE_NEWS } from './news/Infrastructure.js';
import { BIO_NEWS } from './news/Bio.js';
import { AEROSPACE_NEWS } from './news/Aerospace.js';
import { RETAIL_NEWS } from './news/Retail.js';
import { ENERGY_NEWS } from './news/Energy.js';
import { FINANCE_NEWS } from './news/Finance.js';

// Editorial categories also drive news shocks in live market sessions.
export const CURRENT_NEWS = [
    ...IT_NEWS,
    ...ENTERTAINMENT_NEWS,
    ...INFRASTRUCTURE_NEWS,
    ...BIO_NEWS,
    ...AEROSPACE_NEWS,
    ...RETAIL_NEWS,
    ...ENERGY_NEWS,
    ...FINANCE_NEWS,
].map(article => ({
    ...article,
    body: [...article.body],
    type: '뉴스',
    time: '소식 모음',
    isPositive: article.category.endsWith('호재')
}));
