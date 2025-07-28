const getParcelProperties = (itemSize) => {
    switch (itemSize) {
      case "small":
        return { parcelWeight: 2, parcelVolume: 0.2 };
      case "medium":
        return { parcelWeight: 5, parcelVolume: 0.5 };
      default:
        return { parcelWeight: 10, parcelVolume: 1 };
    }
};


module.exports= getParcelProperties;