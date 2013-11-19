var toxStudies = {"study":[
  {
    "uuid":	"IUC4-1d75f01c-3b2b-35f5-84f1-ce23e22b6c73",
    "protocol":	
    {
      "category":"TO_BIODEG_WATER_SCREEN_SECTION",
      "endpoint":"Biodegradation in water: screening tests, IUC4#1/Ch.3.5",
      "guidance": ["OECD Guideline 301 D (Ready Biodegradability: Closed Bottle Test)"]
    },
    "parameters":	{},
    "effects":	[
      {
        "endpoint":	"% Degradation",
        "conditions":	{"Time point":"28 d"},
        "result":	
        {
        	"unit":	"%",
        	"loValue":	90.0
        }
      }
    ]
  },{
    "uuid":	"IUC4-2f64ab27-d2be-352e-b9d8-4f0274fd6633",
    "protocol":	
    {
      "category":"PC_PARTITION_SECTION",
      "endpoint":"Partition coefficient, IUC4#5/Ch.2.5",
      "guidance": ["Method: other (measured)"]
    },
    "parameters":	{},
    "effects":	[
      {
        "endpoint":	"log Pow",
        "conditions":	{"Temperature":"25 °C"},
        "result":	
        {
        	"unit":	null,
        	"loValue":	0.35
        }
      }
    ]
  },{
    "uuid":	"IUC4-2f64ab27-d2be-352e-b9d8-4f0274fd6633",
    "protocol":	
    {
      "category":"PC_PARTITION_SECTION",
      "endpoint":"Partition coefficient, IUC4#5/Ch.2.5",
      "guidance": ["Method: other (measured)"]
    },
    "parameters":	{},
    "effects":	[
      {
        "endpoint":	"log Pow",
        "conditions":	{"Temperature":"26 °C"},
        "result":	
        {
        	"unit":	"ml",
        	"loValue":	0.25
        }
      }
    ]
  },{
    "uuid":	"IUC4-7adb0d03-f69b-32a9-9efe-86b4a8577893",
    "protocol":	
    {
      "category":"EC_FISHTOX_SECTION",
      "endpoint":"Short-term toxicity to fish, IUC4#53/Ch.4.1",
      "guidance": ["Method: other: acute toxicity test; \"static bioassay\""]
    },
    "parameters":	{"Test organism":"Lepomis cyanellus"},
    "effects":	[
      {
        "endpoint":	"LC50",
        "conditions":	{"Exposure":"96"},
        "result":	
        {
        	"unit":	"mg/L",
        	"loValue":	83.1
        }
      }
    ]
  },{
    "uuid":	"IUC4-ae64fc3b-22a4-3173-9362-9cce1ff622ae",
    "protocol":	
    {
      "category":"TO_ACUTE_ORAL_SECTION",
      "endpoint":"Acute toxicity: oral, IUC4#2/Ch.5.1.1",
      "guidance": ["Method: other: no data"]
    },
    "parameters":	{"Species":"rat","Sex":"male/female"},
    "effects":	[
      {
        "endpoint":	"LD50",
        "conditions":	{"Temperature":"24 °C","Sex":"male"},
        "result":	
        {
        	"unit":	"mg/kg bw",
        	"loValue":	260.0,
        	"upValue":	320.0
      	}
      },
      {
        "endpoint":	"LD50",
        "conditions":	{"Temperature":"25 °C","Sex":"female"},
        "result":	
        {
        	"unit":	"mg/kg bw",
        	"loValue":	320.0,
        	"upValue":	2000.0
      	}
      }
      
    ]
  }
]}