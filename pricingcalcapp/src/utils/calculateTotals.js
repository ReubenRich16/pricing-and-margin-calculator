// src/utils/calculateTotals.js
export function calculateTotals(worksheetData, materials, labourRates, customer = null) {
    const GST_RATE = 0.10;
    let totalMaterialCost = 0;
    let totalLabourCost = 0;

    let marginPercentage = worksheetData.marginPercentage || 25;
    if (customer && customer.customPricing) {
        marginPercentage = customer.pricingRules?.materialMarkupPercentage ?? marginPercentage;
    }

    (worksheetData.groups || []).forEach(group => {
        (group.lineItems || []).forEach(item => {
            if (!item || !(item.quantity > 0)) return;
            const material = materials.find(m => m.id === item.materialId);
            if (material) {
                // Use the standardised 'costPrice' field.
                let unitCost = material.costPrice || 0;

                // Apply category-specific discounts if they exist
                if (customer?.customPricing && material.category && Array.isArray(customer.pricingRules?.categoryPricing)) {
                    const categoryRule = customer.pricingRules.categoryPricing.find(
                        rule => rule.category === material.category
                    );
                    if (categoryRule && typeof categoryRule.discount === 'number') {
                        unitCost *= (1 - categoryRule.discount / 100);
                    }
                }
                totalMaterialCost += unitCost * (parseFloat(item.quantity) || 0);
            }
        });

        (group.labourItems || []).forEach(labour => {
            if (!labour) return;
            const rate = parseFloat(labour.rate) || 0;
            const quantity = parseFloat(labour.quantity) || 0;
            if (rate > 0 && quantity > 0) {
                totalLabourCost += rate * quantity;
            }
        });
    });

    const totalCostExGst = totalMaterialCost + totalLabourCost;
    const marginDecimal = marginPercentage / 100;

    if (marginDecimal >= 1) {
        // Prevent division by zero or negative margins
        return {
            totalMaterialCost: 0, totalLabourCost: 0, totalCostExGst: 0,
            markupAmount: 0, subtotalExGst: 0, gstAmount: 0,
            totalPriceIncGst: 0, actualMargin: 0,
        };
    }

    const subtotalExGst = totalCostExGst === 0 ? 0 : totalCostExGst / (1 - marginDecimal);
    const markupAmount = subtotalExGst - totalCostExGst;
    const gstAmount = subtotalExGst * GST_RATE;
    const totalPriceIncGst = subtotalExGst + gstAmount;
    const actualMargin = subtotalExGst > 0
        ? ((subtotalExGst - totalCostExGst) / subtotalExGst) * 100
        : 0;

    return {
        totalMaterialCost,
        totalLabourCost,
        totalCostExGst,
        markupAmount,
        subtotalExGst,
        gstAmount,
        totalPriceIncGst,
        actualMargin,
    };
}