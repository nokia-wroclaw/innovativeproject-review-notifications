import React from 'react';
import { shallow } from 'enzyme';
import { App } from './App';
import { HashRouter as Router, Route } from 'react-router-dom';
import Github from './Github';
import Options from './Options';

it('renders without crashing', () => {
  shallow(<App />);
});

it('renders correct routes', () => {
  const wrapper = shallow(
    <App>
      <Router />
    </App>
  );
  const pathMap = wrapper.find(Route).reduce((pathMap, route) => {
    const routeProps = route.props();
    pathMap[routeProps.path] = routeProps.component;
    return pathMap;
  }, {});
  expect(pathMap['/']).toBe(Github);
  expect(pathMap['/options']).toBe(Options);
});
