const money = new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' });

/** Prices are integers in centavos. */
export const formatPrice = (centavos: number) => money.format(centavos / 100);
export const toCentavos = (pesos: number) => Math.round(pesos * 100);

export const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' });

export const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString('en-PH', {
    year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
  });
