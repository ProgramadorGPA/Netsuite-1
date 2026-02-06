/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 */
define([], function () {

    var WAREHOUSE_MAP = {
        '8': 9,
        '1': 20,
        '6': 66,
        '3': 39,
        '4': 48,
        '5': 57,
        '2': 30
    };

    var warehouseWatcher = null;

    /* ===========================
     * PAGE INIT
     * =========================== */
    function pageInit(context) {
        window.__defaultWarehouseId = null;
        startWarehouseWatcher(context.currentRecord);
    }

    /* ===========================
     * FIELD CHANGED
     * =========================== */
    function fieldChanged(context) {

        var rec = context.currentRecord;

        if (context.fieldId === 'entity') {

            setTimeout(function () {

                setSelectByText(rec, 'shipcarrier', 'Más');
                disableField(rec, 'shipcarrier');

                setTimeout(function () {
                    setSelectByText(rec, 'shipmethod', 'GPA LOCAL');
                    disableField(rec, 'shipmethod');

                    setSelectByText(
                        rec,
                        'custbody_mx_txn_sat_payment_term',
                        'PPD - Pago en Parcialidades o Diferido'
                    );
                }, 800);

                refreshWarehouse(rec);
                startWarehouseWatcher(rec);

            }, 500);
        }

        if (context.fieldId === 'location') {
            refreshWarehouse(rec);
            startWarehouseWatcher(rec);
        }

        if (context.sublistId === 'item' && context.fieldId === 'item') {
            setTimeout(function () {
                forceLineWarehouse(rec);
            }, 300);
        }
    }

    /* ===========================
     * LINE INIT
     * =========================== */
    function lineInit(context) {
        if (context.sublistId !== 'item') return;
        if (!window.__defaultWarehouseId) return;

        setTimeout(function () {
            forceLineWarehouse(context.currentRecord);
        }, 300);
    }

    /* ===========================
     * POST SOURCING
     * =========================== */
    function postSourcing(context) {
        if (context.sublistId !== 'item') return;
        if (context.fieldId !== 'item') return;
        if (!window.__defaultWarehouseId) return;

        setTimeout(function () {
            forceLineWarehouse(context.currentRecord);
        }, 300);
    }

    /* ===========================
     * WATCHER PARA AGREGAR VARIOS
     * =========================== */
    function startWarehouseWatcher(rec) {

        if (warehouseWatcher) {
            clearInterval(warehouseWatcher);
        }

        var attempts = 0;

        warehouseWatcher = setInterval(function () {

            attempts++;
            applyWarehouseToAllLines(rec);

            if (attempts >= 6) {
                clearInterval(warehouseWatcher);
                warehouseWatcher = null;
            }

        }, 700);
    }

    /* ===========================
     * APLICAR A TODAS LAS LÍNEAS
     * =========================== */
    function applyWarehouseToAllLines(rec) {

        if (!window.__defaultWarehouseId) return;

        var count = rec.getLineCount({ sublistId: 'item' });

        for (var i = 0; i < count; i++) {
            try {
                rec.setSublistValue({
                    sublistId: 'item',
                    fieldId: 'location',
                    line: i,
                    value: window.__defaultWarehouseId
                });
            } catch (e) {}
        }
    }


    /* ===========================
     * REFRESH WAREHOUSE HEADER
     * =========================== */
    function refreshWarehouse(rec) {

        var locationValue = rec.getValue({ fieldId: 'location' });
        if (!locationValue) return;

        var warehouseId = WAREHOUSE_MAP[locationValue];
        if (!warehouseId) return;

        window.__defaultWarehouseId = warehouseId;
        applyWarehouseToAllLines(rec);
    }

    /* ===========================
     * HELPERS
     * =========================== */
    function forceLineWarehouse(rec) {
        try {
            rec.setCurrentSublistValue({
                sublistId: 'item',
                fieldId: 'location',
                value: window.__defaultWarehouseId,
                ignoreFieldChange: true
            });
            disableCurrentLineLocation(rec);
        } catch (e) {}
    }

    function setSelectByText(rec, fieldId, text) {
        var field = rec.getField({ fieldId: fieldId });
        if (!field || !field.getSelectOptions) return;

        var options = field.getSelectOptions();
        for (var i = 0; i < options.length; i++) {
            if (options[i].text === text) {
                rec.setValue({
                    fieldId: fieldId,
                    value: options[i].value,
                    ignoreFieldChange: true
                });
                return;
            }
        }
    }

    function disableField(rec, fieldId) {
        try {
            var field = rec.getField({ fieldId: fieldId });
            if (field) field.isDisabled = true;
        } catch (e) {}
    }

    function disableCurrentLineLocation(rec) {
        try {
            var field = rec.getCurrentSublistField({
                sublistId: 'item',
                fieldId: 'location'
            });
            if (field) field.isDisabled = true;
        } catch (e) {}
    }

    return {
        pageInit: pageInit,
        fieldChanged: fieldChanged,
        lineInit: lineInit,
        postSourcing: postSourcing
    };
});