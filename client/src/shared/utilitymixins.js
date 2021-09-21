import * as d3 from "d3";



var utilitymixins = {
  data: function () {
    return {
      MARGIN: {
        LEFT: 50,
        RIGHT: 50,
        TOP: 10,
        BOTTOM: 30
      },
      ChartSettings: {
        TOOLTIP: false,
        OFFSET: true,
      },
      WIDTH: 500,

      HEIGHT: 300,

      BUYORSELL: {
        1: "Buy",
        2: "Sell",
      },
      TRADETYPE: {
        1: "Call",
        2: "Put",
        3: "Future",
        // 4:"Stocks",
      },
      EXCHANGE: {
        1: "NSE",
        4: "CDS",
        3: "BSE",
        5: "MCX",
        2: "CBOE",
      }
    }
  },
  methods: {
    GenerateChart: function (strategy) {
      var chartData = this.GenerateChartPoint(strategy);
      // console.log('chartData :>> ', chartData);
      var paretnId = "#strategy_" + strategy._id + " .chartplaceholder .chart";
      d3.selectAll(paretnId + " > *").remove();
      if (chartData && chartData.length > 0) {
        //this._generateBarChart(chartData, paretnId);
        //this._generateLineChart(chartData, paretnId);
        this._generateLineChart2(chartData, paretnId);
        //this.GetPnL(strategy, null);
      }
      else {

        var placeholder = [{
          "strikePrice": 1,
          //"intrinsicValue": 0,
          "PnL": 1,
          "netPnL": 1,
          "qty": 1,
          "lot": 1,
          "price": 1
        }];
        this._generateLineChart2(placeholder, paretnId);

      }

    },

    GetPnL: function (strategy, chartData) {

      strategy.x0 = null;
      strategy.x1 = null;
      var strikePrices = this.getAllStrikePrices(strategy);
      //var _min  = Math.min(...strikePrices), _max = Math.max(...strikePrices);
      var range = this.getoffsetprices(strikePrices);
      // console.log('strikePrices :>> ', strikePrices);
      // console.log('range :>> ', range);

      // strategy.x0 = range.x0;
      // strategy.x1 = range.x1;



      if (strategy && !chartData) {
        chartData = this.GenerateChartPoint(strategy);
      } else if (!strategy && !chartData) {
        console.error("Stragy and chart data are null");
      }

      //var _min = Math.min(...strikePrices), _max = Math.max(...strikePrices);

      chartData.forEach(x => {
        if (x.strikePrice >= range.x0 && x.strikePrice <= range.x1) {
          console.log('x :>> ', x);

        }

        // if (_min < x.strikePrice) {
        //  console.log('MIN _min, x :>> ', _min, x);
        // }
        // if (_max > x.strikePrice) {
        //   console.log('MAX _max, x :>> ', _max, x);

        // }

      });



    },

    getoffsetprices: function (leastPrice) {
      var _min = Math.min(...leastPrice), _max = Math.max(...leastPrice);
      var strikepricemin = this.getdigits(_min, 'min'), strikepricemax = this.getdigits(_max, 'max');
      var incrementby = this.getdigits(((_min + _max) / 2), 'increment')
      return { x0: strikepricemin, x1: strikepricemax, xstep: incrementby };
    },


    getdigits: function (value, ismin) {
      var _valdiglen = this.ChartSettings.OFFSET ? Math.ceil(Math.log10(value + 1)) : 0;
      var offset = 0;
      var incrementby = 1;
      switch (_valdiglen) {
        case 1:
          offset = 0.05
          incrementby = 0.05;
          break;
        case 2:
          offset = 1;
          incrementby = 1;
          break;
        case 3:
          offset = 10;
          incrementby = 5;
          break;
        case 4:
          offset = 100;
          incrementby = 5;
          break;
        case 5:
          offset = 500;
          incrementby = 10;
          break;
        default:
          offset = 0;
          incrementby = 1;
          break;
      }
      if (ismin == 'min') {
        value -= offset;
      }
      else if (ismin == 'max') {
        value += offset;
      }
      else if (ismin == 'increment') {
        value = incrementby;
      }
      return value;
    },

    getAllStrikePrices: function (strategy) {
      var strikePrices = strategy.trades.map((t) => {
        if (t.tradetype == "Future") {
          return t.price;
        } else {
          return t.selectedstrike;
        }
      });
      return strikePrices;
    },


    GenerateChartPoint: function (strategy) {
      if (strategy && strategy.trades && strategy.trades.length > 0) {
        var range = { x0: parseFloat(strategy.x0), x1: parseFloat(strategy.x1) }
        var tradeCount = strategy.trades.length;
        var chartData = [];
        var strikePrices = this.getAllStrikePrices(strategy);
        var _range = this.getoffsetprices(strikePrices);
        var xStep = _range.xstep;
        range = {
          x0: isNaN(range.x0) ? _range.x0 : range.x0
          , x1: isNaN(range.x1) ? _range.x1 : range.x1
        }
        for (let i = 0; i < tradeCount; i++) {
          if (!strategy.trades[i].checked) { continue }
          let currentTrade = strategy.trades[i];
          var _strikePrice = range.x0;
          var _intrinsicValue = 0, PnL = 0, netPnL = 0;
          let j = 0;
          do {

            if (currentTrade.tradetype == "Call") {
              _intrinsicValue = _strikePrice - currentTrade.selectedstrike > 0 ? _strikePrice - currentTrade.selectedstrike : 0;
            }
            else if (currentTrade.tradetype == "Put") {
              _intrinsicValue = currentTrade.selectedstrike - _strikePrice > 0 ? currentTrade.selectedstrike - _strikePrice : 0;
            }

            if (currentTrade.tradetype == "Future") {
              PnL = currentTrade.buyorsell == "Buy" ? _strikePrice - currentTrade.price : currentTrade.price - _strikePrice;
              netPnL = (currentTrade.quantity * currentTrade.lotsize * PnL);
            } else {
              PnL = currentTrade.buyorsell == "Buy" ? _intrinsicValue - currentTrade.price : currentTrade.price - _intrinsicValue
              PnL = parseFloat(PnL.toFixed());
              netPnL = (currentTrade.quantity * currentTrade.lotsize * PnL);
              netPnL = parseFloat(netPnL.toFixed());
            }

            if (chartData[j]) {
              chartData[j].netPnL += netPnL;
              chartData[j].PnL = PnL;
            } else {
              chartData.push({
                "strikePrice": parseFloat(_strikePrice.toFixed(2)),
                // "intrinsicValue": _intrinsicValue,
                "PnL": PnL,
                "netPnL": netPnL,
                "qty": currentTrade.quantity,
                "lot": currentTrade.lotsize,
                "price": currentTrade.price
              });
            }
            j += 1;
            _strikePrice += xStep;
            //_strikePrice += currentTrade.strikepricestep;
          }
          //while (currentTrade.strikepricemax >= _strikePrice)
          while (range.x1 >= _strikePrice)
        }
        console.log('chartData :>> ', chartData);
        return chartData;
      }
    },

    // POC: BarChart
    _generateBarChart: function (chartData, paretnId) {
      console.log('chartData :>> ', chartData);
      var _numbers = chartData.map(c => c.netPnL);
      var _max = Math.max(..._numbers) + 2000;
      var _min = Math.min(..._numbers) - 1000;

      const svg = d3.select(paretnId).append("svg")
        .attr("width", this.WIDTH + this.MARGIN.LEFT + this.MARGIN.RIGHT)
        .attr("height", this.HEIGHT + this.MARGIN.TOP + this.MARGIN.BOTTOM);
      const g = svg.append("g")
        .attr("transform", `translate(${this.MARGIN.LEFT}, ${this.MARGIN.BOTTOM})`);

      const rect = g.selectAll("rect").data(chartData);
      const x = d3.scaleBand().domain(chartData.map(c => c.strikePrice)).range([0, this.WIDTH]);//.paddingInner(0).paddingOuter(0.5);
      //const y = d3.scaleLinear().domain([_min, _max]).range([0, this.HEIGHT]);/// Changing min & max to start chart from bottom
      const y = d3.scaleLinear().domain([_max, _min]).range([0, this.HEIGHT]);

      const xAxisCall = d3.axisBottom(x);
      const yAxisCall = d3.axisLeft(y);

      g.append("g")
        .attr("class", "x axis")
        .attr("transform", `translate(0,${this.HEIGHT})`)
        .call(xAxisCall);
      g.append("g")
        .attr("class", "y axis")
        .call(yAxisCall);

      rect.enter().append("rect")
        .attr("x", (d) => x(d.strikePrice))
        .attr("y", (d) => y(d.netPnL))
        .attr("width", 30)
        .attr("height", (d) => this.HEIGHT - y(d.netPnL))
        .attr("fill", "#ffc107");
    },

    // POC: Line Chart
    ///Ref: https://observablehq.com/@d3/line-chart
    _generateLineChart: function (chartData, paretnId) {
      const line = d3.line()
        .defined(d => !isNaN(d.netPnL))
        .x(d => x(d.strikePrice))
        .y(d => y(d.netPnL))
      // const x = d3.scaleBand()
      //   .domain(chartData.map(c => c.strikePrice))
      //   .range([this.MARGIN.LEFT, this.WIDTH - this.MARGIN.RIGHT])
      const x = d3.scaleBand().domain(chartData.map(c => c.strikePrice)).range([0, this.WIDTH - this.MARGIN.RIGHT]);

      const y = d3.scaleLinear()
        .domain([d3.min(chartData, d => d.netPnL) - 1000, d3.max(chartData, d => d.netPnL) + 1000]).nice()
        .range([this.HEIGHT - this.MARGIN.BOTTOM, this.MARGIN.TOP])

      const xAxis = g => g
        .attr("transform", `translate(0,${this.HEIGHT - this.MARGIN.BOTTOM})`)
        .call(d3.axisBottom(x).ticks(this.WIDTH / 80).tickSizeOuter(0))
      const yAxis = g => g
        .attr("transform", `translate(${this.MARGIN.LEFT},0)`)
        .call(d3.axisLeft(y))
        .call(g => g.select(".domain").remove())
        .call(g => g.select(".tick:last-of-type text").clone()
          .attr("x", 3)
          .attr("text-anchor", "start")
          .attr("font-weight", "bold")
          .text(chartData.y))

      const svg = d3.select(paretnId).append("svg")
        .attr("viewBox", [0, 0, this.WIDTH, this.HEIGHT]);

      svg.append("g")
        .call(xAxis);

      svg.append("g")
        .call(yAxis);

      svg.append("path")
        .datum(chartData)
        .attr("fill", "none")
        .attr("stroke", "#ffc107")
        .attr("stroke-width", 1.5)
        .attr("stroke-linejoin", "round")
        .attr("stroke-linecap", "round")
        .attr("d", line);
    },

    ///POC : Line Chart
    ///ref: https://observablehq.com/@simulmedia/line-chart
    ///ref: https://gist.github.com/llad/3766585 && http://jsfiddle.net/samselikoff/Jqmzd/2/
    _generateLineChart2: function (chartData, paretnId) {
      // console.log('chartData :>> ', chartData);

      if (!chartData || !paretnId)
        return;
      //const lgcolor = "#f0fff0";
      const linecolor = "stroke-current text-yellow-600";

      var xScale, yScale, xAxisCall, yAxisCall;//, xAxisCall2;
      var minPnL = d3.min(chartData, d => d.netPnL);
      var maxPnL = d3.max(chartData, d => d.netPnL);
      var minSP = d3.min(chartData, d => d.strikePrice);
      var maxSP = d3.max(chartData, d => d.strikePrice);



      // console.log('minPnL :>> ', minPnL);
      // minPnL = minPnL - (minPnL / 10);
      // console.log('minPnL :>> ', minPnL);
      // console.log('maxPnL :>> ', maxPnL);
      // maxPnL = maxPnL + (maxPnL / 10);
      // console.log('maxPnL :>> ', maxPnL);
      // if (maxPnL < 0) {
      //   maxPnL = 10000;
      // }


      xScale = d3.scaleLinear().domain([minSP, maxSP]).range([0, this.WIDTH]);
      // xScale = d3.scaleBand().domain(chartData.map(c => c.strikePrice)).range([0, this.WIDTH - this.MARGIN.RIGHT]);
      yScale = d3.scaleLinear()
        .domain([minPnL, maxPnL]).nice()
        .range([this.HEIGHT - this.MARGIN.BOTTOM, this.MARGIN.TOP]);
      xAxisCall = d3.axisBottom(xScale);
      yAxisCall = d3.axisLeft(yScale)

        .ticks(10)
        .tickFormat(d3.formatPrefix(".1", 1e5));

      const svg = d3.select(paretnId).append("svg")
        .attr("class", "line")
        .attr("width", this.WIDTH + this.MARGIN.LEFT + this.MARGIN.RIGHT)
        .attr("height", this.HEIGHT);
      // .attr("height", this.HEIGHT + this.MARGIN.TOP + this.MARGIN.BOTTOM) ;

      var line = d3
        .line()
        .defined(d => !isNaN(d.netPnL))
        .x(d => xScale(d.strikePrice))
        .y(d => yScale(d.netPnL));

      svg
        .append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(" + this.MARGIN.LEFT + "," + (this.HEIGHT - this.MARGIN.BOTTOM) + ")")
        .call(xAxisCall)
        .selectAll("text")
        .style("text-anchor", "begin")
        .attr("dx", "2em")
        .attr("dy", "0em")
        .attr("transform", "rotate(40)");

      svg
        .append("g")
        .attr("class", "y axis")
        .attr("transform", "translate(" + this.MARGIN.LEFT + ", 0)")
        .call(yAxisCall)
        .selectAll("text")
        .attr("dx", "-5");
      //.attr("width","500");


      svg.append("g")
        .attr("class", "x axis zero")
        .attr("transform", "translate(" + this.MARGIN.LEFT + "," + yScale(0) + ")")
        .call(xAxisCall.tickSize(0).tickFormat(""));

      svg
        .append("path")
        .datum(chartData)
        .attr("fill", "none")
        .attr("class", linecolor)
        .attr("stroke-width", 1)
        .attr("transform", "translate(" + this.MARGIN.LEFT + ",0)")
        .attr("stroke-linejoin", "round")
        .attr("stroke-linecap", "round")
        .attr("d", line);

      if (this.ChartSettings.TOOLTIP) {
        /// 
        /// இன்னும் சில பிரச்னை இருக்கு 
        ///

        const tooltip = svg.append("g");

        const bisect = d3.bisector(d => d.strikePrice).left;
        const callout = (g, value) => {
          if (!value) return g.style("display", "none");
          g.style("display", null)
            .style("pointer-events", "none")
            .style("font", "10px sans-serif");

          const path = g.selectAll("path")
            .data([null])
            .join("path")
            .attr("fill", "white")
            .attr("stroke", "black");

          const text = g.selectAll("text")
            .data([null])
            .join("text")
            .call(text => text
              .selectAll("tspan")
              .data((value + "").split(/\n/))
              .join("tspan")
              .attr("x", 0)
              .attr("y", (d, i) => `${i * 1.1}em`)
              .style("font-weight", (_, i) => i ? null : "bold")
              .text(d => d));

          const { y, width: w, height: h } = text.node().getBBox();

          text.attr("transform", `translate(${-w / 2},${15 - y})`);
          path.attr("d", `M${-w / 2 - 10},5H-5l5,-5l5,5H${w / 2 + 10}v${h + 20}h-${w + 20}z`);
        }

        svg.on("touchmove mousemove", function (e) {
          // console.log('this.MARGIN.RIGHT :>> ', _this.MARGIN.LEFT);
          var x0 = xScale.invert(d3.pointer(e)[0]);
          // console.log('x0 :>> ', x0);
          // console.log('typeof(x0) :>> ', typeof(x0));
          // x0 = Number.parseFloat(x0) + 50;
          // console.log('x0 :>> ', x0);
          const index = bisect(chartData, x0, 1);
          const a = chartData[index - 1];
          const b = chartData[index];
          var val = b && (x0 - a.strikePrice > b.strikePrice - x0) ? b : a;
          tooltip
            .attr("transform", `translate(${xScale(x0)},${yScale(val.netPnL)})`)
            .call(callout, `${val.netPnL}\n ${x0}`);

        });
      }











    },





  },

};
export default utilitymixins;


// /// Ref: https://stackoverflow.com/questions/3552461/how-to-format-a-javascript-date?page=1&tab=votes#tab-top
// function GetTodayDate() {
//   var d = new Date();
//   var ye = new Intl.DateTimeFormat('en', { year: 'numeric' }).format(d);
//   var mo = new Intl.DateTimeFormat('en', { month: 'short' }).format(d);
//   var da = new Intl.DateTimeFormat('en', { day: '2-digit' }).format(d);
//   console.log(`${da}-${mo}-${ye}`);
// }