var map = L.map("map", {
  zoom: 11,
  center: [35.6406, 139.5404]
});

map.attributionControl.addAttribution("<a href='http://www.ktr.mlit.go.jp/keihin/water_flood_sim/tamagawa/tamagawa2/index.html'>多摩川水系洪水氾濫シミュレーション</a>のデータを加工");

var baseLayers = {
  "写真": L.tileLayer("http://cyberjapandata.gsi.go.jp/xyz/ort/{z}/{x}/{y}.jpg", {
    attribution: "<a href='http://maps.gsi.go.jp/development/ichiran.html#ort'>写真(地理院タイル)</a>",
    minZoom: 2,
    maxZoom: 20,
    maxNativeZoom: 18
  }),
  "標準地図": L.tileLayer("http://cyberjapandata.gsi.go.jp/xyz/std/{z}/{x}/{y}.png", {
    attribution: "<a href='http://maps.gsi.go.jp/development/ichiran.html#std'>標準地図(地理院タイル)</a>",
    minZoom: 2,
    maxZoom: 20,
    maxNativeZoom: 18
  }),
  "色別標高図": L.tileLayer("http://cyberjapandata.gsi.go.jp/xyz/relief/{z}/{x}/{y}.png", {
    attribution: "<a href='http://maps.gsi.go.jp/development/ichiran.html#relief'>色別標高図(地理院タイル)</a>",
    minZoom: 5,
    maxZoom: 20,
    maxNativeZoom: 15
  }).addTo(map)
};



L.control.layers(baseLayers, {}).addTo(map);

var focus = null;
var jsons = [];
var overlays = [];

setInterval(function() {
  if (jsons.length == 0) {
    while (overlays.length > 0)
      map.removeLayer(overlays.pop());
    return;
  }
  var first = jsons.shift();
  jsons.push(first);
  overlays.unshift(L.imageOverlay(
    first.properties.src,
    L.latLngBounds(L.GeoJSON.coordsToLatLngs(first.geometry.coordinates[0]))
  ).addTo(map));

  while (overlays.length > 2)
    map.removeLayer(overlays.pop());
  overlays.forEach(function(overlay, i) {
    overlay.setOpacity(Math.pow(0.5, i));

  });

  map.attributionControl.setPrefix("t=" + first.properties.time);

}, 200);



fetch("geojson/index.geojson").then(function(a) {
  return a.json();
}).then(function(geojson) {
  L.geoJson(geojson, {
    pointToLayer: function(feature, latlng) {
      var marker = L.circleMarker(latlng, {
        radius: 6,
        color: "#000",
        weight: 2,
        opacity: 0.9,
        fillColor: "#ffc",
        fillOpacity: 0.9
      });
      return marker;
    },
    onEachFeature: function(feature, layer) {
      layer.on("click", function() {
        if (focus)
          focus.setStyle({
            fillColor: "#ffc"
          });
        layer.setStyle({
          fillColor: "#f00"
        });
        focus = layer;
        jsons = [];

        fetch("geojson/" + feature.properties.id + ".geojson").then(function(b) {
          return b.json();
        }).then(function(fc) {
          jsons = fc.features;
        });
      });
    }
  }).addTo(map);


});
