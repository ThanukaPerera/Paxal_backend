const { Parcel } = require("../../models/ParcelModel");

const barChart = async (req, res) => {
    try {
        const parcels = await Parcel.find();

        const chartData = Object.values(
            parcels.reduce((acc, parcel) => {
                if (!parcel.createdAt) return acc; // Skip if createdAt is missing

                const date = new Date(parcel.createdAt).toISOString().split("T")[0]; // Convert to YYYY-MM-DD

                if (!acc[date]) {
                    acc[date] = { date, parcelCount: 0 };
                }

                acc[date].parcelCount += 1; // Count parcels for each date

                return acc;
            }, {})
        ).sort((a, b) => new Date(a.date) - new Date(b.date)); // Sort in ascending order

        console.log(chartData);

        res.status(200).json(chartData);
    } catch (error) {
        console.error("Error fetching bar chart data:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

module.exports = barChart;
