// Sample CSV data (replace with your actual data)
const csvData = `Category,Subcategory,Item,Value
A,A1,A1a,10
A,A1,A1b,5
A,A2,A2a,8
B,B1,B1a,12
B,B2,B2b,7
`;

// Parse the CSV data
const data = d3.csvParse(csvData);

// Transform data to hierarchical JSON
function buildHierarchy(data) {
  const root = { name: "root", children: [] };
  data.forEach(d => {
    const parts = [d.Category, d.Subcategory, d.Item];
    let currentNode = root;
    parts.forEach((part, i) => {
      if (i < parts.length - 1) {
        let childNode = currentNode.children.find(c => c.name === part);
        if (!childNode) {
          childNode = { name: part, children: [] };
          currentNode.children.push(childNode);
        }
        currentNode = childNode;
      } else {
        currentNode.children.push({ name: part, value: +d.Value });
      }
    });
  });
  return root;
}

const hierarchyData = buildHierarchy(data);

// Set dimensions and radius
const width = 500;
const height = 500;
const radius = Math.min(width, height) / 2;

// Create partition layout
const partition = d3.partition().size([2 * Math.PI, radius]);
const root = partition(d3.hierarchy(hierarchyData).sum(d => d.value / 1000));


// Create arc generator
const arc = d3.arc()
  .startAngle(d => d.x0)
  .endAngle(d => d.x1)
  .innerRadius(d => d.y0)
  .outerRadius(d => d.y1);

// Create SVG element
const svg = d3.select("body").append("svg")
  .attr("width", width)
  .attr("height", height)
  .append("g")
  .attr("transform", `translate(${width / 2}, ${height / 2})`);

// Bind data to path elements
svg.selectAll("path")
  .data(root.descendants())
  .enter().append("path")
  .attr("d", arc)
  .style("fill", d => {
    // Simple color scale 
    const colorScale = d3.scaleOrdinal(d3.schemeCategory10);
    return colorScale(d.data.name);
  })
  .style("stroke", "#fff");


  // Add text labels to arcs
svg.selectAll("text")
  .data(root.descendants().filter(d => d.depth)) // Skip root node
  .enter().append("text")
  .attr("transform", function(d) {
    const x = (d.x0 + d.x1) / 2 * 180 / Math.PI;
    const y = (d.y0 + d.y1) / 2;
    return `rotate(${x - 90}) translate(${y},0) rotate(${x < 180 ? 0 : 180})`;
  })
  .attr("dy", "0.35em")
  .attr("text-anchor", d => ((d.x0 + d.x1) / 2) < Math.PI ? "start" : "end")
  .text(d => d.data.name)
  .style("font-size", "10px")
  .style("fill", "#000");
