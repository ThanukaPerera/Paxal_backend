const Branch = require("../../../models/BranchesModel");
const catchAsync = require("../../../utils/catchAscync");

const getParcelDropdownData = catchAsync(async (req, res, next) => {
  // Fetch all branches
  const branches = await Branch.find({}, 'branchId location').sort({ location: 1 });

  // Define dropdown options
  const dropdownData = {
    branches: branches.map(branch => ({
      value: branch._id,
      label: `${branch.branchId} - ${branch.location}`
    })),
    itemTypes: [
      { value: "Glass", label: "Glass" },
      { value: "Flowers", label: "Flowers" },
      { value: "Document", label: "Document" },
      { value: "Clothing", label: "Clothing" },
      { value: "Electronics", label: "Electronics" },
      { value: "Food", label: "Food" },
      { value: "Other", label: "Other" }
    ],
    itemSizes: [
      { value: "small", label: "Small" },
      { value: "medium", label: "Medium" },
      { value: "large", label: "Large" }
    ],
    submittingTypes: [
      { value: "pickup", label: "Pickup" },
      { value: "drop-off", label: "Drop-off" },
      { value: "branch", label: "Branch" }
    ],
    receivingTypes: [
      { value: "doorstep", label: "Doorstep" },
      { value: "collection_center", label: "Collection Center" }
    ],
    shippingMethods: [
      { value: "standard", label: "Standard" },
      { value: "express", label: "Express" }
    ],
    statuses: [
      { value: "OrderPlaced", label: "Order Placed" },
      { value: "PendingPickup", label: "Pending Pickup" },
      { value: "PickedUp", label: "Picked Up" },
      { value: "ArrivedAtDistributionCenter", label: "Arrived at Distribution Center" },
      { value: "ShipmentAssigned", label: "Shipment Assigned" },
      { value: "InTransit", label: "In Transit" },
      { value: "ArrivedAtCollectionCenter", label: "Arrived at Collection Center" },
      { value: "DeliveryDispatched", label: "Delivery Dispatched" },
      { value: "Delivered", label: "Delivered" },
      { value: "NotAccepted", label: "Not Accepted" },
      { value: "WrongAddress", label: "Wrong Address" },
      { value: "Return", label: "Return" },
      { value: "Cancelled", label: "Cancelled" }
    ],
    paymentMethods: [
      { value: "cash", label: "Cash" },
      { value: "card", label: "Card" },
      { value: "bank_transfer", label: "Bank Transfer" },
      { value: "online", label: "Online Payment" }
    ],
    cancellationReasons: [
      { value: "customer_request", label: "Customer Request" },
      { value: "unable_to_pickup", label: "Unable to Pickup" },
      { value: "incorrect_details", label: "Incorrect Details" },
      { value: "payment_issue", label: "Payment Issue" },
      { value: "item_not_available", label: "Item Not Available" },
      { value: "other", label: "Other" }
    ],
    returnReasons: [
      { value: "recipient_refused", label: "Recipient Refused" },
      { value: "wrong_address", label: "Wrong Address" },
      { value: "recipient_not_available", label: "Recipient Not Available" },
      { value: "damaged_item", label: "Damaged Item" },
      { value: "incomplete_address", label: "Incomplete Address" },
      { value: "other", label: "Other" }
    ]
  };

  res.status(200).json({
    status: "success",
    data: dropdownData
  });
});

module.exports = getParcelDropdownData;
