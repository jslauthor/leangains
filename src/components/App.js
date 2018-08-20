import React from "react";
import styled from "styled-components";
import { getStateFromQuery, stateToQueryString } from "../utils/StateUtils";

import TextField from "@material-ui/core/TextField";
import MenuItem from "@material-ui/core/MenuItem";

const CM_MULTIPLE = 2.54;
const KG_MULTIPLE = 2.2;

/**
 * Actions
 */

const STANDARD_CHANGED: string = "STANDARD_CHANGED";
const standardChanged = (metric: number) => ({
  type: STANDARD_CHANGED,
  payload: metric === 0 ? false : true
});

const GENDER_CHANGED: string = "GENDER_CHANGED";
const genderChanged = (gender: string) => ({
  type: GENDER_CHANGED,
  payload: gender
});

const NAME_CHANGED: string = "NAME_CHANGED";
const nameChanged = (name: string) => ({
  type: NAME_CHANGED,
  payload: name
});

const WEIGHT_CHANGED: string = "WEIGHT_CHANGED";
const weightChanged = (metric: boolean, weight: number) => ({
  type: WEIGHT_CHANGED,
  payload: metric ? weight : weight / KG_MULTIPLE
});

const AGE_CHANGED: string = "AGE_CHANGED";
const ageChanged = (age: number) => ({
  type: AGE_CHANGED,
  payload: age
});

const HEIGHT_CHANGED: string = "HEIGHT_CHANGED";
const heightChanged = (metric: boolean, height: number) => ({
  type: HEIGHT_CHANGED,
  payload: metric ? height : height * CM_MULTIPLE
});

const BODY_FAT_CHANGED: string = "BODY_FAT_CHANGED";
const bodyFatChanged = (bodyFatPercentage: number) => ({
  type: BODY_FAT_CHANGED,
  payload: bodyFatPercentage
});

const MUSCLE_MASS_CHANGED: string = "MUSCLE_MASS_CHANGED";
const muscleMassChanged = (muscleMass: number) => ({
  type: MUSCLE_MASS_CHANGED,
  payload: muscleMass
});

const STEPS_PER_DAY_CHANGED: string = "STEPS_PER_DAY_CHANGED";
const stepsPerDayChanged = (steps: number) => ({
  type: STEPS_PER_DAY_CHANGED,
  payload: steps
});

/**
 * Create Context provider and reducer which stores the state in query variables.
 * Yes, this is a side effect, but it is the data structure I want to use as the source of truth
 * to enable easy link sharing.
 */

const Context = React.createContext();
const saveQueryParams = state => {
  window.history.pushState(
    {},
    document.title,
    `${window.location.href.split("?")[0]}?data=${stateToQueryString(state)}`
  );
};

const reducer = (state, action) => {
  switch (action.type) {
    case STANDARD_CHANGED:
      return { ...state, metric: action.payload };
    case GENDER_CHANGED:
      return { ...state, gender: action.payload };
    case NAME_CHANGED:
      return { ...state, name: action.payload };
    case WEIGHT_CHANGED:
      return { ...state, weight: action.payload };
    case AGE_CHANGED:
      return { ...state, age: action.payload };
    case HEIGHT_CHANGED:
      return { ...state, height: action.payload };
    case BODY_FAT_CHANGED:
      return { ...state, bodyFatPercentage: action.payload };
    case MUSCLE_MASS_CHANGED:
      return { ...state, muscleMassAttr: action.payload };
    case STEPS_PER_DAY_CHANGED:
      return { ...state, stepsPerDay: action.payload };
    default:
      return;
  }
};

export class StateProvider extends React.Component {
  state = {
    dispatch: action => {
      this.setState(state => {
        const newState = reducer(state, action);
        saveQueryParams(newState);
        return newState; // force refresh, gross
      });
    }
  };

  static getDerivedStateFromProps = (props, state) => {
    // Super hacky way of grabbing the query string without needing another lib
    return getStateFromQuery(location.search.substring(6));
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

const AppContainer = styled.div`
  display: grid;
  margin: 20px;
`;

const nearest = value => Math.round(value * 100) / 100;

const getDisplayHeight = (metric, height) =>
  nearest(metric ? height : height / CM_MULTIPLE);
const getDisplayWeight = (metric, weight) =>
  nearest(metric ? weight : weight * KG_MULTIPLE);

class App extends React.Component {
  render() {
    return (
      <StateProvider location={this.props.location}>
        <Context.Consumer>
          {state => (
            <AppContainer>
              <TextField
                select
                label="Metric or Imperial"
                value={state.metric ? 1 : 0}
                onChange={event =>
                  state.dispatch(standardChanged(event.target.value))
                }
                helperText="Please select metric or imperial"
                margin="normal"
              >
                {[
                  { label: "Metric", value: 1 },
                  { label: "Imperial", value: 0 }
                ].map(option => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                select
                label="Sex"
                value={state.gender}
                onChange={event =>
                  state.dispatch(genderChanged(event.target.value))
                }
                helperText="Select your closest biological sex."
                margin="normal"
              >
                {[
                  { label: "Male", value: "M" },
                  { label: "Female", value: "F" }
                ].map(option => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                placeholder="Name"
                value={state.name}
                label="Name"
                onChange={event =>
                  state.dispatch(nameChanged(event.target.value))
                }
              />
              <TextField
                placeholder="Weight"
                value={getDisplayWeight(state.metric, state.weight)}
                label="Weight"
                onChange={event =>
                  state.dispatch(
                    weightChanged(state.metric, event.target.value)
                  )
                }
              />
              <TextField
                placeholder="Age"
                value={state.age}
                label="Age"
                onChange={event =>
                  state.dispatch(ageChanged(event.target.value))
                }
              />
              <TextField
                placeholder="Enter your height"
                value={getDisplayHeight(state.metric, state.height)}
                label={`Height ${state.metric ? "(cm)" : "(in)"}`}
                onChange={event =>
                  state.dispatch(
                    heightChanged(state.metric, event.target.value)
                  )
                }
              />
              <TextField
                placeholder="Enter your body fat percentage"
                value={state.bodyFatPercentage}
                label="Body Fat Percentage"
                onChange={event =>
                  state.dispatch(bodyFatChanged(event.target.value))
                }
              />
              <TextField
                select
                label="Muscle Mass"
                value={state.muscleMassAttr}
                onChange={event =>
                  state.dispatch(muscleMassChanged(event.target.value))
                }
                helperText="Select your muscle mass"
                margin="normal"
              >
                {[
                  { label: "Average", value: "NA" },
                  { label: "Muscular", value: "M" },
                  { label: "Very Muscular", value: "VM" }
                ].map(option => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                placeholder="Enter the number of average daily steps"
                value={state.stepsPerDay}
                onChange={event =>
                  state.dispatch(stepsPerDayChanged(event.target.value))
                }
                label="Activity Level (Steps per day)"
              />
              <h1>
                Base Metabolic Rate: {Math.round(state.bmr)}
                Cut: {Math.round((state.bmr - 500) * 0.925)} /{" "}
                {Math.round((state.bmr - 500) * 1.0925)}
              </h1>
            </AppContainer>
          )}
        </Context.Consumer>
      </StateProvider>
    );
  }
}

export default App;
