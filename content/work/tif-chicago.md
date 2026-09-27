---
title: How do TIFs impact municipal tax bases?
kind: research
order: 1
areas: [economics, data]
year: 2026
place: Suburban Cook County, Illinois
coords: [-87.72, 41.68]   # [longitude, latitude]; centre of the five study villages
dek: In five Cook County villages where TIF districts cover most parcels, diverted property value pushes up the tax rates schools, parks, and towns must charge — by up to 46% in Phoenix.
image: images/TIF.png
tags: [R, SQL, Plotly, Geospatial analysis, Public finance]
links:
  - {label: Read the memo, url: "https://rushikeshay.github.io/tif-districts-analysis-ccao-project/"}
  - {label: Code, url: "https://github.com/rushikeshay/tif-districts-analysis-ccao-project"}
note: Originally started during an internship with the Cook County Assessor's Office (CCAO), Jan–Mar 2026. Subsequently developed and extended independently. Not an official CCAO work product.
readme:
  repo: rushikeshay/tif-districts-analysis-ccao-project
  drop: [overview, objectives, project context]   # overview is restated below; context is the note above
---
Tax Increment Financing (TIF) freezes a district's taxable value and diverts the growth above that base into a redevelopment fund. Overlapping agencies such as school, park, and library districts and the municipality itself must then levy against a smaller base, so their rates go up.

This memo identifies the five Cook County municipalities outside Chicago with the highest share of parcels inside TIF districts: Phoenix, Bedford Park, Bellwood, Ford Heights, and Posen. It then traces each one's frozen base against its TIF increment from 2006 to 2023. Comparing actual effective tax rates with a counterfactual in which the increment stayed in the base shows how much of each rate is TIF-induced. In Phoenix, where 98% of parcels sit inside a TIF, the 2023 rate of 2.05% is nearly 46% above its 1.40% counterfactual. Across all five villages, park districts and municipalities bear the heaviest rate inflation.
