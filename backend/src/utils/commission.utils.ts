/**
 * Commission Calculation Utilities
 * 
 * Handles commission calculations for vendors and delivery partners
 */

/**
 * Calculate vendor commission based on subtotal
 * Commission is calculated on subtotal only (not including tax or delivery fee)
 * Platform bears discount costs - vendor gets full subtotal amount minus commission
 * 
 * @param subtotal - Order subtotal before tax and fees
 * @param commissionRate - Commission percentage (e.g., 20 for 20%)
 * @returns Object with commissionAmount and vendorEarnings
 */
export function calculateVendorCommission(
    subtotal: number,
    commissionRate: number
): { commissionAmount: number; vendorEarnings: number } {
    const commissionAmount = (subtotal * commissionRate) / 100;
    const vendorEarnings = subtotal - commissionAmount;

    return {
        commissionAmount: Math.round(commissionAmount * 100) / 100, // Round to 2 decimals
        vendorEarnings: Math.round(vendorEarnings * 100) / 100
    };
}

/**
 * Calculate delivery partner commission
 * Commission is calculated on total delivery earnings (delivery fee + tip)
 * 
 * @param deliveryFee - Base delivery fee
 * @param tip - Tip amount
 * @param commissionRate - Commission percentage (e.g., 15 for 15%)
 * @returns Object with commissionAmount and partnerEarnings
 */
export function calculateDeliveryCommission(
    deliveryFee: number,
    tip: number,
    commissionRate: number
): { commissionAmount: number; partnerEarnings: number } {
    const grossEarnings = deliveryFee + tip;
    const commissionAmount = (grossEarnings * commissionRate) / 100;
    const partnerEarnings = grossEarnings - commissionAmount;

    return {
        commissionAmount: Math.round(commissionAmount * 100) / 100,
        partnerEarnings: Math.round(partnerEarnings * 100) / 100
    };
}

/**
 * Generate a human-readable name for a payout cycle
 * 
 * @param cycleType - Type of cycle (WEEKLY, BIWEEKLY, MONTHLY)
 * @param startDate - Start date of the cycle
 * @returns Formatted cycle name
 */
export function generatePayoutCycleName(
    cycleType: 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY',
    startDate: Date
): string {
    const monthNames = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];

    const month = monthNames[startDate.getMonth()];
    const year = startDate.getFullYear();
    const day = startDate.getDate();

    switch (cycleType) {
        case 'WEEKLY':
            // Get week number of the month
            const weekOfMonth = Math.ceil(day / 7);
            return `Week ${weekOfMonth} ${month} ${year}`;
        case 'BIWEEKLY':
            const biweekNumber = day <= 15 ? 1 : 2;
            return `Biweek ${biweekNumber} ${month} ${year}`;
        case 'MONTHLY':
            return `${month} ${year}`;
        default:
            return `${month} ${day}, ${year}`;
    }
}

/**
 * Calculate the next cycle dates based on cycle type
 * 
 * @param cycleType - Type of cycle (WEEKLY, BIWEEKLY, MONTHLY)
 * @param fromDate - Date to calculate from (defaults to now)
 * @returns Object with startDate and endDate
 */
export function getNextCycleDates(
    cycleType: 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY',
    fromDate: Date = new Date()
): { startDate: Date; endDate: Date } {
    const startDate = new Date(fromDate);
    startDate.setHours(0, 0, 0, 0); // Start of day

    const endDate = new Date(startDate);

    switch (cycleType) {
        case 'WEEKLY':
            endDate.setDate(endDate.getDate() + 6);
            break;
        case 'BIWEEKLY':
            endDate.setDate(endDate.getDate() + 13);
            break;
        case 'MONTHLY':
            endDate.setMonth(endDate.getMonth() + 1);
            endDate.setDate(0); // Last day of the month
            break;
    }

    endDate.setHours(23, 59, 59, 999); // End of day

    return { startDate, endDate };
}

/**
 * Calculate payout amount from gross amount and commission rate
 * 
 * @param grossAmount - Amount before commission
 * @param commissionRate - Commission percentage
 * @returns Net payout amount
 */
export function calculatePayoutAmount(
    grossAmount: number,
    commissionRate: number
): number {
    const commissionAmount = (grossAmount * commissionRate) / 100;
    const netAmount = grossAmount - commissionAmount;
    return Math.round(netAmount * 100) / 100;
}

/**
 * Validate commission rate
 * 
 * @param rate - Commission rate to validate
 * @returns true if valid, false otherwise
 */
export function isValidCommissionRate(rate: number): boolean {
    return rate >= 0 && rate <= 100;
}
