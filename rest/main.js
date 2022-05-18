
let center = [51.12672139472725,71.46367342966803];
function init(){
    let map = new ymaps.Map('map' , {
        center: center,
        zoom: 17,
        controls: []
    });
    let myPlacemark = new ymaps.Placemark([51.12672139472725,71.46367342966803],{
        balloonContentHeader:'Ресторан Рабия',
        balloonContentBody:'11:00 – 00:00',
    },{});
    map.geoObjects.add(myPlacemark);
}
ymaps.ready(init);