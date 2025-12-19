// const overlay = document.getElementById('map-overlay');
// const img = document.getElementById('floor-plan');

// const calibrationPoints = [];

// overlay.addEventListener('click', (e) => {
//     if (calibrationPoints.length >= 4) {
//         alert('Đã đủ 4 điểm');
//         return;
//     }

//     const rect = img.getBoundingClientRect();

//     // Pixel tương đối so với ảnh
//     const x = e.clientX - rect.left;
//     const y = e.clientY - rect.top;

//     // Vẽ điểm
//     const dot = document.createElement('div');
//     dot.className = 'calib-point';
//     dot.style.left = `${x}px`;
//     dot.style.top = `${y}px`;
//     overlay.appendChild(dot);

//     calibrationPoints.push({ x, y });

//     console.log(`Điểm ${calibrationPoints.length}:`, { x, y });

//     if (calibrationPoints.length === 4) {
//         console.log('🎯 4 điểm pixel:', calibrationPoints);
//         alert('Đã click đủ 4 điểm pixel');
//     }
// });
// function getImageOffset() {
//     const el = document.getElementById('floor-plan');
//     const rect = el.getBoundingClientRect();

//     const rectBody = document.body.getBoundingClientRect();

//     const cornersBody = {
//         topLeft: { x: rectBody.left, y: rectBody.top },
//         topRight: { x: rectBody.right, y: rectBody.top },
//         bottomRight: { x: rectBody.right, y: rectBody.bottom },
//         bottomLeft: { x: rectBody.left, y: rectBody.bottom },
//     };

//     const corners = {
//         topLeft: { x: rect.left, y: rect.top },
//         topRight: { x: rect.right, y: rect.top },
//         bottomRight: { x: rect.right, y: rect.bottom },
//         bottomLeft: { x: rect.left, y: rect.bottom },
//     };

//     const offsetXLeft = corners.topLeft.x - cornersBody.topLeft.x;
//     const offsetYLeft = corners.topLeft.y - cornersBody.topLeft.y;

//     const offsetXRight = corners.topRight.x - cornersBody.topRight.x;
//     const offsetYRight = corners.topRight.y - cornersBody.topRight.y;

//     const offsetXBottom = corners.bottomRight.x - cornersBody.bottomRight.x;
//     const offsetYBottom = corners.bottomRight.y - cornersBody.bottomRight.y;

//     const offsetXTop = corners.bottomLeft.x - cornersBody.bottomLeft.x;
//     const offsetYTop = corners.bottomLeft.y - cornersBody.bottomLeft.y;

//     console.log('offsetXLeft', offsetXLeft);
//     console.log('offsetYLeft', offsetYLeft);
//     console.log('offsetXRight', offsetXRight);
//     console.log('offsetYRight', offsetYRight);
//     console.log('offsetXBottom', offsetXBottom);
//     console.log('offsetYBottom', offsetYBottom);
//     console.log('offsetXTop', offsetXTop);
//     console.log('offsetYTop', offsetYTop);
// }

const map = document.getElementById('map-container');

map.addEventListener('click', (e) => {
    const rect = map.getBoundingClientRect();

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    console.log('Relative X,Y:', x, y);
});
