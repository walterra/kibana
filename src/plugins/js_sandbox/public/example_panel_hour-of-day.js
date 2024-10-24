function(props) {
  const [initalized, setInitialized] = React.useState(false);
  const wrapperRef = React.useRef(null);
  const vegaRef = React.useRef(null);
  // Based on this example:
  // https://observablehq.com/@vega/vega-lite-api

  const data = React.useMemo(() => {
    const data = [
      ...props.crossfilter.map(d => ({
        hour: d['hour'],
        count: d.count,
        type: 'crossfilter',
        typeOrder: 0
      })),
      ...props.data.map((d, i) => ({
        hour: d['hour'],
        count: d.count - (props.crossfilter.find(d2 => d2['hour'] === d['hour'])?.count ?? 0),
        type: 'context',
        typeOrder: 1
      }))
    ];
    console.log('data hour', data);
    return data;
  }, [props.data, props.crossfilter]);

  React.useEffect(() => {
    if (vegaRef.current) {
      const view = vegaRef.current;
      console.log('---- data change', view)
      view.data('table', data).run();
    }
  }, [data, initalized]);
  console.log('vegaRef.current',vegaRef.current)

  React.useEffect(() => {
    if (vegaRef.current) {
      const view = vegaRef.current;
      view.width(props.width);
      view.height(props.height);
    }
  }, [props.width, props.height, initalized])

  React.useEffect(() => {
    // setup API options
    const options = {
      config: {
        // Vega-Lite default configuration
      },
      init: (view) => {
        vegaRef.current = view;
        // initialize tooltip handler
        view.tooltip(new vegaTooltip.Handler().call);

        view.addSignalListener('brushX', function(event, item) {
          if (item.hour) {
            props.dispatch(`WHERE hDATE_EXTRACT("hour_of_day", @timestamp) >= ${Math.round(item.hour[0])} AND DATE_EXTRACT("hour_of_day", @timestamp) < ${Math.round(item.hour[1])}`);
          } else {
            props.dispatch('');
          }
        })

        setInitialized(true);
      },
      view: {
        renderer: "canvas",
      },
    };
    // register vega and vega-lite with the API
    vl.register(vega, vegaLite, options);

    const brush = vl.selectInterval().name('brushX').encodings('x');

    // now you can use the API!
    const spec = vl.markBar({ tooltip: true })
      .data({ name: 'table'})
      .encode(
        // https://vega.github.io/vega-lite/docs/timeunit.html
        vl.y().sum("count"),
        vl.x().fieldQ('hour').bin(true),
        vl.color().fieldN('type').scale({ range: ['#ddd','#00a69b'] }).legend({disable: true}),
        vl.opacity().condition({test:"datum['type'] == 'context'",value:0.3}).value(1),
        vl.order().field('typeOrder'),
        vl.tooltip([vl.fieldN("hour"), vl.fieldQ("count")])
      )
      .width(props.width)
      .height(props.height)
      .autosize({ type: 'fit-x'})
      .config({view:{stroke:null}})
      .params(brush)

      spec.render()
      .then((viewElement) => {
        // render returns a promise to a DOM element containing the chart
        // viewElement.value contains the Vega View object instance
        const el = wrapperRef.current;
        while (el.firstChild) el.removeChild(el.firstChild);
        wrapperRef.current.appendChild(viewElement);
      });
    },
    []
  );

  return <div ref={wrapperRef} id="myChart" style={{
    width: "100%",
    height: "100%",
  }}></div>;
}
