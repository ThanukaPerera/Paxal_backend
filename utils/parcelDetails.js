const getParcelProperties = (itemSize) => {
    switch (itemSize) {
      case "small":
        return { parcelWeight: 2, parcelVolume: 3 };
      case "medium":
        return { parcelWeight: 5, parcelVolume: 6 };
      default:
        return { parcelWeight: 10, parcelVolume: 8 };
    }
};

module.exports= getParcelProperties;