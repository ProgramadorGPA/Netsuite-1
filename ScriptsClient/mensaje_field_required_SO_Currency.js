/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 */
define(['N/search'], function (search) {

    function validateLine(context) {

        if (context.sublistId !== 'item') {
            return true;
        }

        var rec = context.currentRecord;

        // 1️⃣ Moneda de la ORDEN DE VENTA (header)
        var orderCurrency = rec.getValue({
            fieldId: 'currency'
        });

        // 2️⃣ Artículo seleccionado
        var itemId = rec.getCurrentSublistValue({
            sublistId: 'item',
            fieldId: 'item'
        });

        if (!itemId || !orderCurrency) {
            return true;
        }

        // 3️⃣ Buscar moneda del artículo
        var itemData = search.lookupFields({
            type: search.Type.ITEM,
            id: itemId,
            columns: ['currency']
        });

        if (!itemData.currency || !itemData.currency.length) {
            return true;
        }

        var itemCurrencyId   = itemData.currency[0].value;
        var itemCurrencyText = itemData.currency[0].text;

        // 4️⃣ Validación FINAL
        if (itemCurrencyId !== orderCurrency) {

            alert(
                '❌ Moneda no permitida\n\n' +
                'La Orden de Venta está en una moneda distinta a la del artículo.\n\n' +
                'Moneda del artículo: ' + itemCurrencyText
            );

            return false;
        }

        return true;
    }

    return {
        validateLine: validateLine
    };
});
