function(props) {
  const [initalized, setInitialized] = React.useState(false);
  const wrapperRef = React.useRef(null);
  const vegaRef = React.useRef(null);
  // Based on this example:
  // https://observablehq.com/@vega/vega-lite-api

  const data = React.useMemo(() => {
    const data = [
      ...props.crossfilter.map(d => ({
        bytes: d['bytes'],
        count: d.count,
        type: 'crossfilter',
        typeOrder: 0
      })),
      ...props.data.map((d, i) => ({
        bytes: d['bytes'],
        count: d.count - (props.crossfilter.find(d2 => d2['bytes'] === d['bytes'])?.count ?? 0),
        type: 'context',
        typeOrder: 1
      }))
    ];
    console.log('data bytes', data);
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
          if (item.bytes) {
            props.dispatch(`WHERE bytes >= ${Math.round(item.bytes[0])} AND bytes < ${Math.round(item.bytes[1])}`);
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
        vl.x().fieldQ('bytes').bin(true),
        vl.color().fieldN('type').scale({ range: ['#eee','#00a69b'] }).legend({disable: true}),
        vl.order().field('typeOrder'),
        vl.tooltip([vl.fieldN("bytes"), vl.fieldQ("count")])
      )
      .width(props.width)
      .height(props.height)
      .autosize({ type: 'fit-x'})
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
