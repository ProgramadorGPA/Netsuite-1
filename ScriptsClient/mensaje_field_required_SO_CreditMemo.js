/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 */
define(['N/search', 'N/error'], function (search, error) {

    function beforeSubmit(context) {

        if (context.type !== context.UserEventType.CREATE &&
            context.type !== context.UserEventType.EDIT) {
            return;
        }

        var rec = context.newRecord;

        var uuid = rec.getValue({
            fieldId: 'custbody_mx_cfdi_uuid'
        });

        // Si no hay UUID, no validamos
        if (!uuid) {
            return;
        }

        var currentId = rec.id;

        var ncSearch = search.create({
            type: search.Type.CREDIT_MEMO,
            filters: [
                ['custbody_mx_cfdi_uuid', 'is', uuid],
                'AND',
                ['mainline', 'is', 'T']
            ],
            columns: ['internalid']
        });

        var duplicated = false;

        ncSearch.run().each(function (result) {
            var foundId = result.getValue('internalid');

            // Si es otra Nota de Crédito → BLOQUEAR
            if (!currentId || foundId !== currentId) {
                duplicated = true;
                return false;
            }
            return true;
        });

        if (duplicated) {
            throw error.create({
                name: 'UUID_DUPLICADO',
                message:
                    'El UUID ya está relacionado a otra Nota de Crédito.\n\n' +
                    'No se permite reutilizar un CFDI ya devuelto.',
                notifyOff: false
            });
        }
    }

    return {
        beforeSubmit: beforeSubmit
    };
});