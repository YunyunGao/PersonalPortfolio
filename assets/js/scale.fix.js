(function(document) {
    var metas = document.getElementsByTagName('meta'),
        changeViewportContent = function(content) {
            for (var i = 0; i < metas.length; i++) {
                if (metas[i].name == "viewport") {
                    metas[i].content = content;
                }
            }
        },
        initialize = function() {
            changeViewportContent("width=device-width, minimum-scale=1.0, maximum-scale=1.0");
        },
        gestureStart = function() {
            changeViewportContent("width=device-width, minimum-scale=0.25, maximum-scale=1.6");
        },
        gestureEnd = function() {
            initialize();
        };


    if (navigator.userAgent.match(/iPhone/i)) {
        initialize();

        document.addEventListener("touchstart", gestureStart, false);
        document.addEventListener("touchend", gestureEnd, false);
    }

    // Automatically handle line breaks in links with inline-link class
    document.addEventListener("DOMContentLoaded", function() {
        var inlineLinks = document.querySelectorAll('a.inline-link');
        inlineLinks.forEach(function(link) {
            // Only process links with text longer than a threshold
            if (link.textContent.trim().length > 15) {
                // Add word breaking opportunities at spaces
                var text = link.textContent;
                var words = text.split(' ');
                if (words.length > 1) {
                    link.innerHTML = words.join('<wbr> ');
                }
                
                // Override the display style to allow wrapping
                link.style.cssText += '; display: inline !important; white-space: normal !important;';
            }
        });
    });
})(document); 