// --- Utility: Calculates all worksheet financials for pricing and margin (Australian spelling) ---
// Now supports optional customer argument for custom pricing logic.

export function calculateTotals(worksheetData, materials, labourRates, customer = null) {
    const GST_RATE = 0.10;
    let totalMaterialCost = 0;
    let totalLabourCost = 0;

    // Get margin from customer custom pricing, fallback to worksheet margin
    let marginPercentage = worksheetData.marginPercentage || 25;
    if (customer && customer.customPricing) {
        marginPercentage = customer.pricingRules?.materialMarkupPercentage ?? 25;
    }

    (worksheetData.groups || []).forEach(group => {
        (group.lineItems || []).forEach(item => {
            const material = materials.find(m => m.id === item.materialId);
            if (material && item.quantity > 0) {
                let costPrice = material.costPrice || 0;
                // Apply category-specific discount if present
                if (customer && customer.customPricing && material.category) {
                    const categoryRule = customer.pricingRules.categoryPricing?.find(
                        rule => rule.category === material.category
                    );
                    if (categoryRule && typeof categoryRule.discount === 'number') {
                        const discountMultiplier = 1 - (categoryRule.discount / 100);
                        costPrice = costPrice * discountMultiplier;
                    }
                }
                totalMaterialCost += costPrice * (item.quantity || 0);
            }
        });

        (group.labourItems || []).forEach(labour => {
            const rate = parseFloat(labour.timberRate || labour.steelRate || labour.rate) || 0;
            const quantity = parseFloat(labour.quantity) || 0;
            totalLabourCost += rate * quantity;
        });

        (group.lineItems || []).forEach(item => {
            if (Array.isArray(item.labourApplications)) {
                item.labourApplications.forEach(lab => {
                    const rate = parseFloat(lab.overrideRate || lab.defaultRate) || 0;
                    const quantity = parseFloat(item.quantity) || 0;
                    totalLabourCost += rate * quantity;
                });
            }
        });
    });

    const totalCostExGst = totalMaterialCost + totalLabourCost;
    const marginDecimal = marginPercentage / 100;
    if (marginDecimal >= 1) {
        return { totalMaterialCost: 0, totalLabourCost: 0, totalCostExGst: 0, markupAmount: 0, subtotalExGst: 0, gstAmount: 0, totalPriceIncGst: 0, actualMargin: 0 };
    }

    const subtotalExGst = totalCostExGst === 0 ? 0 : totalCostExGst / (1 - marginDecimal);
    const markupAmount = subtotalExGst - totalCostExGst;
    const gstAmount = subtotalExGst * GST_RATE;
    const totalPriceIncGst = subtotalExGst + gstAmount;
    const actualMargin = subtotalExGst > 0 ? ((subtotalExGst - totalCostExGst) / subtotalExGst) * 100 : 0;

    return {
        totalMaterialCost,
        totalLabourCost,
        totalCostExGst,
        markupAmount,
        subtotalExGst,
        gstAmount,
        totalPriceIncGst,
        actualMargin,
        usedCustomPricing: !!(customer && customer.customPricing)
    };
}
