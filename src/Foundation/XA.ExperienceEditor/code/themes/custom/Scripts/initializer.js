window.$xa(document).ready(function () {
    window.$xa.xaMover = new SXA.SxaMover(window.$xa);
    setTimeout(function () {
        window.$xa.xaMover.initMoveComponentPlugIn();
        window.$xa.xaMover.initDeleteComponentPlugIn();
        window.$xa.xaMover.initTouchDragNDropPlugIn();
    }, 1);
});
