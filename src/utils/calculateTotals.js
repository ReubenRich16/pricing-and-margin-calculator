// src/utils/calculateTotals.js
// Bug #3: Normalised material unit cost handling
// Australian spelling retained (Labour). No localisation edits to other modules yet.

function getNormalizedMaterialUnitCost(material) {
    if (!material || typeof material !== 'object') return 0;

    // Preferred explicit costPrice
    if (typeof material.costPrice === 'number' && material.costPrice > 0) {
        return material.costPrice;
    }

    // costPerUnit
    if (typeof material.costPerUnit === 'number' && material.costPerUnit > 0) {
        return material.costPerUnit;
    }

    // costPerM2 * m2PerUnit
    if (typeof material.costPerM2 === 'number' && material.costPerM2 > 0 &&
        typeof material.m2PerUnit === 'number' && material.m2PerUnit > 0) {
        return material.costPerM2 * material.m2PerUnit;
    }

    // costPerPack / unitsPerPack
    if (typeof material.costPerPack === 'number' && material.costPerPack > 0) {
        if (typeof material.unitsPerPack === 'number' && material.unitsPerPack > 0) {
            return material.costPerPack / material.unitsPerPack;
        }
        if (typeof material.m2PerPack === 'number' && material.m2PerPack > 0 &&
            typeof material.m2PerUnit === 'number' && material.m2PerUnit > 0) {
            const inferredUnits = material.m2PerPack / material.m2PerUnit;
            if (inferredUnits > 0) {
                return material.costPerPack / inferredUnits;
            }
        }
    }

    // Fallback: salePrice if no cost data (could be RRP)
    if (typeof material.salePrice === 'number' && material.salePrice > 0) {
        return material.salePrice;
    }

    return 0;
}

export function calculateTotals(worksheetData, materials, labourRates, customer = null) {
    const GST_RATE = 0.10;
    let totalMaterialCost = 0;
    let totalLabourCost = 0;

    // Margin logic (customer override)
    let marginPercentage = worksheetData.marginPercentage || 25;
    if (customer && customer.customPricing) {
        marginPercentage = customer.pricingRules?.materialMarkupPercentage ?? marginPercentage;
    }

    (worksheetData.groups || []).forEach(group => {
        // Material line items
        (group.lineItems || []).forEach(item => {
            if (!item || !(item.quantity > 0)) return;
            const material = materials.find(m => m.id === item.materialId);
            if (material) {
                let unitCost = getNormalizedMaterialUnitCost(material);

                // Category discount
                if (customer && customer.customPricing && material.category &&
                    Array.isArray(customer.pricingRules?.categoryPricing)) {
                    const categoryRule = customer.pricingRules.categoryPricing.find(
                        rule => rule.category === material.category
                    );
                    if (categoryRule && typeof categoryRule.discount === 'number') {
                        unitCost = unitCost * (1 - categoryRule.discount / 100);
                    }
                }

                totalMaterialCost += unitCost * (parseFloat(item.quantity) || 0);
            }
        });

        // Labour items at group level
        (group.labourItems || []).forEach(labour => {
            if (!labour) return;
            const rate = parseFloat(labour.timberRate || labour.steelRate || labour.rate) || 0;
            const quantity = parseFloat(labour.quantity) || 0;
            if (rate > 0 && quantity > 0) {
                totalLabourCost += rate * quantity;
            }
        });

        // Labour applications attached to materials
        (group.lineItems || []).forEach(item => {
            if (!item || !Array.isArray(item.labourApplications)) return;
            const materialQty = parseFloat(item.quantity) || 0;
            if (materialQty <= 0) return;
            item.labourApplications.forEach(lab => {
                if (!lab) return;
                const rate = parseFloat(lab.overrideRate || lab.defaultRate) || 0;
                if (rate > 0) {
                    totalLabourCost += rate * materialQty;
                }
            });
        });
    });

    const totalCostExGst = totalMaterialCost + totalLabourCost;
    const marginDecimal = marginPercentage / 100;

    if (marginDecimal >= 1) {
        return {
            totalMaterialCost: 0,
            totalLabourCost: 0,
            totalCostExGst: 0,
            markupAmount: 0,
            subtotalExGst: 0,
            gstAmount: 0,
            totalPriceIncGst: 0,
            actualMargin: 0,
            usedCustomPricing: !!(customer && customer.customPricing)
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
        usedCustomPricing: !!(customer && customer.customPricing)
    };
}