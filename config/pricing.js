// backend/config/pricing.js
// Reglas de negocio Paseos Peludos (MXN)

const PRICING = {
  basePrice: 150,                      // $150 por hora
  durationMins: 60,                    // 1 hora
  operationalPercent: 0.10,            // 10% gastos operativos
  fixedAppFee: 50,                     // $50 libres para la app (sin promo)
  promoSplit: { app: 1/3, walker: 2/3 } // Con promo: 1/3 app, 2/3 paseador
};

/**
 * Calcula reparto según tus reglas.
 * @param {number} amount - lo que paga el cliente (MXN)
 * @param {boolean} isPromo - si aplica promo
 */
function calcularReparto(amount, isPromo = false) {
  const operatives = +(amount * PRICING.operationalPercent).toFixed(2);
  const neto = +(amount - operatives).toFixed(2);

  if (!isPromo) {
    return {
      operatives,
      app: +PRICING.fixedAppFee.toFixed(2),
      walker: +(neto - PRICING.fixedAppFee).toFixed(2),
      scheme: 'FIXED_APP_FEE'
    };
  } else {
    return {
      operatives,
      app: +(neto * PRICING.promoSplit.app).toFixed(2),
      walker: +(neto * PRICING.promoSplit.walker).toFixed(2),
      scheme: 'PROMO_SPLIT'
    };
  }
}

module.exports = { PRICING, calcularReparto };
