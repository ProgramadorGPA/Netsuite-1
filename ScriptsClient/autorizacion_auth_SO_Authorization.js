/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 */
define([], function () {

    var LOCATION_REQUIERE_AUT = '5'; // ← CAMBIA POR TU INTERNAL ID

    function beforeSubmit(context) {

        if (context.type !== context.UserEventType.CREATE &&
            context.type !== context.UserEventType.EDIT) {
            return;
        }

        var rec = context.newRecord;

        var locationId = rec.getValue({ fieldId: 'location' });

        // Si no aplica, liberar
        if (locationId !== LOCATION_REQUIERE_AUT) {
            rec.setValue({ fieldId: 'custbody_gpa_req_autorizacion', value: false });
            rec.setValue({ fieldId: 'custbody_gpa_bloq_proceso', value: false });
            return;
        }

        // Requiere autorización
        rec.setValue({ fieldId: 'custbody_gpa_req_autorizacion', value: true });

        var authorized = rec.getValue({ fieldId: 'custbody_gpa_autorizado' });

        if (!authorized) {
            rec.setValue({ fieldId: 'custbody_gpa_bloq_proceso', value: true });

            throw 'Esta Orden de Venta requiere autorización antes de continuar.';
        }

        // Ya autorizado → liberar
        rec.setValue({ fieldId: 'custbody_gpa_bloq_proceso', value: false });
    }

    function beforeLoad(context) {

        if (context.type !== context.UserEventType.VIEW) return;

        var rec = context.newRecord;

        if (rec.getValue({ fieldId: 'custbody_gpa_bloq_proceso' })) {

            context.form.addPageInitMessage({
                type: 'WARNING',
                title: 'Orden en Autorización',
                message: 'Esta orden está bloqueada hasta que sea autorizada.'
            });
        }
    }

    return {
        beforeSubmit: beforeSubmit,
        beforeLoad: beforeLoad
    };
});