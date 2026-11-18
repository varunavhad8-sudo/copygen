import { useState, useEffect, useCallback } from 'react';

export const CURRENCIES = [
  { code: 'INR', symbol: '₹',   name: 'Indian Rupee'    },
  { code: 'USD', symbol: '$',   name: 'US Dollar'        },
  { code: 'EUR', symbol: '€',   name: 'Euro'             },
  { code: 'GBP', symbol: '£',   name: 'British Pound'    },
  { code: 'SAR', symbol: '﷼',   name: 'Saudi Riyal'      },
  { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham'       },
  { code: 'AUD', symbol: 'A$',  name: 'Australian Dollar'},
  { code: 'CAD', symbol: 'C$',  name: 'Canadian Dollar'  },
  { code: 'SGD', symbol: 'S$',  name: 'Singapore Dollar' },
  { code: 'JPY', symbol: '¥',   name: 'Japanese Yen'     },
  { code: 'CHF', symbol: 'Fr',  name: 'Swiss Franc'      },
  { code: 'MYR', symbol: 'RM',  name: 'Malaysian Ringgit'},
];

const TARGET_CODES = CURRENCIES.filter(c => c.code !== 'INR').map(c => c.code).join(',');

/**
 * useCurrency — Fetches live INR exchange rates from frankfurter.app.
 * All admin prices are stored in INR, so conversion is INR → selected currency.
 * Falls back to hardcoded approximate rates if the API is unavailable.
 */
export function useCurrency() {
  const [currency, setCurrency] = useState(
    () => CURRENCIES.find(c => c.code === (localStorage.getItem('cg_admin_currency') || 'INR')) || CURRENCIES[0]
  );
  const [rates, setRates]     = useState({ INR: 1 }); // INR base = 1
  const [loading, setLoading] = useState(true);
  const [rateDate, setRateDate] = useState(null);

  const fetchRates = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch(`https://api.frankfurter.app/latest?from=INR&to=${TARGET_CODES}`);
      const data = await res.json();
      setRates({ INR: 1, ...data.rates });
      setRateDate(data.date);
    } catch {
      // Fallback approximate rates (as of mid-2025)
      setRates({
        INR: 1,
        USD: 0.012,
        EUR: 0.011,
        GBP: 0.0095,
        SAR: 0.045,
        AED: 0.044,
        AUD: 0.018,
        CAD: 0.016,
        SGD: 0.016,
        JPY: 1.81,
        CHF: 0.011,
        MYR: 0.056,
      });
      setRateDate('offline');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRates(); }, [fetchRates]);

  const changeCurrency = (code) => {
    const found = CURRENCIES.find(c => c.code === code);
    if (found) {
      setCurrency(found);
      localStorage.setItem('cg_admin_currency', code);
    }
  };

  /**
   * Convert an INR amount to the currently selected currency.
   * @param {number} inrAmount
   * @returns {string} formatted string e.g. "$12.34" or "¥1,234"
   */
  const convert = (inrAmount) => {
    if (!inrAmount || isNaN(inrAmount)) return `${currency.symbol}0`;
    const rate = rates[currency.code] || 1;
    const converted = inrAmount * rate;
    // JPY has no decimal places; others get 2
    const decimals = currency.code === 'JPY' ? 0 : 2;
    return `${currency.symbol}${converted.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    })}`;
  };

  return { currency, rates, loading, rateDate, changeCurrency, convert };
}
