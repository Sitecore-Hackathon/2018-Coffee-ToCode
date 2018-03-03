if (typeof (Sitecore) != "undefined" && typeof (Sitecore.Treeview) != "undefined") {
    Sitecore.Treeview.getDataContext = function (node) {
        var dataContextNode = node;
        while (dataContextNode.id.lastIndexOf("_") <= dataContextNode.id.indexOf("_")) {
            dataContextNode = dataContextNode.up();
        }

        var dataContextId = node.id.substring(dataContextNode.id.indexOf("_") + 1, dataContextNode.id.lastIndexOf("_"));
        var dataContextLowered;
        if (dataContextId) {
            dataContextLowered = dataContextId.toLowerCase();
        }

        while (!node.previous(".scDataContexts")) {
            node = node.up();
        }

        var r = node.previous(".scDataContexts").childElements().find(function (e) {
            var id = e.readAttribute("data-context-id");
            return id && id.toLowerCase() === dataContextLowered;
        });

        if (!r) {
            return null;
        }

        return { id: dataContextId, parameters: r.value || "" };
    };
}