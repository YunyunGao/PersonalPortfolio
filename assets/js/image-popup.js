function openPopup(imageSrc) {
    document.getElementById('popupImage').src = imageSrc;
    document.getElementById('imagePopup').style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function closePopup() {
    document.getElementById('imagePopup').style.display = 'none';
    document.body.style.overflow = 'auto';
}

document.addEventListener('DOMContentLoaded', function() {
    // Close popup when clicking outside the image
    const imagePopup = document.getElementById('imagePopup');
    if (imagePopup) {
        imagePopup.addEventListener('click', function(event) {
            if (event.target === this) {
                closePopup();
            }
        });
    }

    // Close popup with Escape key
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            closePopup();
        }
    });
}); 