import React from "react";
import Button from "@material-ui/core/Button";
import styled from "styled-components";
import { BrowserRouter as Router, Route, Switch } from "react-router-dom";
import queryString from "query-string";
import { getStateFromQuery } from "../utils/StateUtils";

/**
 * Create Context provider and reducer which stores the state in query variables.
 * Yes, this is a side effect, but it is the data structure I want to use as the source of truth
 * to enable easy link sharing.
 */

const Context = React.createContext();

const reducer = (state, action) => {
  if (action.type === "TOGGLE") {
    return { ...state, isADuck: !state.isADuck };
  }
};

export class StateProvider extends React.Component {
  state = {
    data: {},
    dispatch: action => {
      this.setState(state => reducer(state, action));
    }
  };

  static getDerivedStateFromProps = (props, state) => {
    const { data } = queryString.parse(props.location.search);
    return getStateFromQuery(data);
  };

  render() {
    const {
      state,
      props: { children }
    } = this;
    return <Context.Provider value={state}>{children}</Context.Provider>;
  }
}

/**
 * Fun Component Business
 */

const AppContainer = styled.div``;

class AppBase extends React.Component {
  render() {
    return (
      <StateProvider location={this.props.location}>
        <Context.Consumer>
          {state => (
            <AppContainer>
              <Button variant="contained" color="primary">
                {state.bmr}
              </Button>
            </AppContainer>
          )}
        </Context.Consumer>
      </StateProvider>
    );
  }
}

const App = () => (
  <Router>
    <div>
      <Switch>
        <Route exact path="/" component={AppBase} />
      </Switch>
    </div>
  </Router>
);

export default App;
