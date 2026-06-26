package model

const (
	PlanFree     = "free"
	PlanBasic    = "basic_100gb"
	PlanPro      = "pro_500gb"
	PlanBusiness = "business_2tb"
)

const (
	PlanIntervalMonthly = "monthly"
	PlanIntervalYearly  = "yearly"
)

var PlanLimits = map[string]int64{
	PlanFree:     1 * 1024 * 1024 * 1024,      // 1 GB
	PlanBasic:    100 * 1024 * 1024 * 1024,    // 100 GB
	PlanPro:      500 * 1024 * 1024 * 1024,    // 500 GB
	PlanBusiness: 2 * 1024 * 1024 * 1024 * 1024, // 2 TB
}

type PlanPricing struct {
	Amount     int64  `json:"amount"`
	Currency   string `json:"currency"`
	Interval   string `json:"interval"`
}

type PlanInfo struct {
	ID          string      `json:"id"`
	Name        string      `json:"name"`
	StorageGB   int64       `json:"storageGb"`
	StorageDesc string      `json:"storageDesc"`
	Monthly     PlanPricing `json:"monthly"`
	Yearly      PlanPricing `json:"yearly"`
}

var Plans = []PlanInfo{
	{
		ID:          PlanBasic,
		Name:        "Basic",
		StorageGB:   100,
		StorageDesc: "Backups for personal projects",
		Monthly:     PlanPricing{Amount: 9900, Currency: "INR", Interval: PlanIntervalMonthly},
		Yearly:      PlanPricing{Amount: 99900, Currency: "INR", Interval: PlanIntervalYearly},
	},
	{
		ID:          PlanPro,
		Name:        "Pro",
		StorageGB:   500,
		StorageDesc: "For professionals and small teams",
		Monthly:     PlanPricing{Amount: 19900, Currency: "INR", Interval: PlanIntervalMonthly},
		Yearly:      PlanPricing{Amount: 199900, Currency: "INR", Interval: PlanIntervalYearly},
	},
	{
		ID:          PlanBusiness,
		Name:        "Business",
		StorageGB:   2000,
		StorageDesc: "For businesses with large datasets",
		Monthly:     PlanPricing{Amount: 44900, Currency: "INR", Interval: PlanIntervalMonthly},
		Yearly:      PlanPricing{Amount: 449900, Currency: "INR", Interval: PlanIntervalYearly},
	},
}
