/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 */
define(['N/record', 'N/ui/dialog', 'N/search', 'N/error'], function (record, dialog, search, error) {

    function beforeSubmit(context) {

        if (context.type !== context.UserEventType.CREATE &&
            context.type !== context.UserEventType.EDIT) {
            return;
        }

        var rec = context.newRecord;

        var currency = rec.getValue({ fieldId: 'currency' });
        var tranDate = rec.getValue({ fieldId: 'trandate' });
        var exchangeRate = rec.getValue({ fieldId: 'exchangerate' });

        // Si es moneda base, no aplica
        if (!currency || !exchangeRate) {
            return;
        }

        // Buscar tipo de cambio oficial del día
        var rateSearch = search.create({
            type: 'currencyrate',
            filters: [
                ['currency', 'anyof', currency],
                'AND',
                ['effectivedate', 'on', tranDate]
            ],
            columns: ['exchangerate']
        });

        var results = rateSearch.run().getRange({ start: 0, end: 1 });

        if (!results || results.length === 0) {
            throw error.create({
                name: 'NO_EXCHANGE_RATE',
                message:
                    'No existe un tipo de cambio oficial cargado para la fecha ' +
                    tranDate +
                    '.\n\nNo es posible guardar la Orden de Venta.',
                notifyOff: false
            });
        }

        var officialRate = parseFloat(results[0].getValue('exchangerate'));
        var orderRate = parseFloat(exchangeRate);

        // Comparación (tolerancia opcional)
        if (officialRate !== orderRate) {

            throw error.create({
                name: 'INVALID_EXCHANGE_RATE',
                message:
                    'El tipo de cambio de la Orden de Venta (' + orderRate +
                    ') no coincide con el tipo de cambio oficial del día (' +
                    officialRate + ').\n\n' +
                    'Posible causa:\n' +
                    '- El tipo de cambio fue modificado manualmente\n' +
                    '- La fecha de la orden no corresponde al día actual',
                notifyOff: false
            });
        }
    }

    return {
        beforeSubmit: beforeSubmit
    };
});
