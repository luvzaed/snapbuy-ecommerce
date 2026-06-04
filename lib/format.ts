// Format a price for display using the Turkish locale.
// Turkish convention: "." separates thousands and "," separates decimals.
// Example: 40000 -> "40.000,00"
export function formatPrice(price: number): string {
  return price.toLocaleString('tr-TR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
