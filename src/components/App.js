// @flow
import type { QueryState, GenderType, MassType } from "../utils/StateUtils";

import * as React from "react";
import styled from "styled-components";
import { getStateFromQuery, stateToQueryString } from "../utils/StateUtils";

import TextField from "@material-ui/core/TextField";
import MenuItem from "@material-ui/core/MenuItem";

const CM_MULTIPLE = 2.54;
const KG_MULTIPLE = 2.2;

/**
 * Actions
 */

type Action =
  | { type: "STANDARD_CHANGED", payload: boolean }
  | { type: "GENDER_CHANGED", payload: GenderType }
  | { type: "NAME_CHANGED", payload: string }
  | { type: "WEIGHT_CHANGED", payload: number }
  | { type: "AGE_CHANGED", payload: number }
  | { type: "HEIGHT_CHANGED", payload: number }
  | { type: "BODY_FAT_CHANGED", payload: number }
  | { type: "MUSCLE_MASS_CHANGED", payload: MassType }
  | { type: "STEPS_PER_DAY_CHANGED", payload: number };

const standardChanged = (metric: number) => ({
  type: "STANDARD_CHANGED",
  payload: metric === 0 ? false : true
});

const genderChanged = (gender: string) => ({
  type: "GENDER_CHANGED",
  payload: gender
});

const nameChanged = (name: string) => ({
  type: "NAME_CHANGED",
  payload: name
});

const weightChanged = (metric: boolean, weight: number) => ({
  type: "WEIGHT_CHANGED",
  payload: metric ? weight : weight / KG_MULTIPLE
});

const ageChanged = (age: number) => ({
  type: "AGE_CHANGED",
  payload: age
});

const heightChanged = (metric: boolean, height: number) => ({
  type: "HEIGHT_CHANGED",
  payload: metric ? height : height * CM_MULTIPLE
});

const bodyFatChanged = (bodyFatPercentage: number) => ({
  type: "BODY_FAT_CHANGED",
  payload: bodyFatPercentage
});

const muscleMassChanged = (muscleMass: MassType) => ({
  type: "MUSCLE_MASS_CHANGED",
  payload: muscleMass
});

const stepsPerDayChanged = (steps: number) => ({
  type: "STEPS_PER_DAY_CHANGED",
  payload: steps
});

/**
 * Create Context provider and reducer which stores the state in query variables.
 * Yes, this is a side effect, but it is the data structure I want to use as the source of truth
 * to enable easy link sharing.
 */

const Context: Object = React.createContext();
const saveQueryParams = (state: QueryState) => {
  window.history.pushState(
    {},
    document.title,
    `${window.location.href.split("?")[0]}?data=${stateToQueryString(state)}`
  );
};

const reducer: (QueryState, Action) => QueryState = (
  state: QueryState,
  action: Action
) => {
  switch (action.type) {
    case "STANDARD_CHANGED":
      return { ...state, metric: action.payload };
    case "GENDER_CHANGED":
      return { ...state, gender: action.payload };
    case "NAME_CHANGED":
      return { ...state, name: action.payload };
    case "WEIGHT_CHANGED":
      return { ...state, weight: action.payload };
    case "AGE_CHANGED":
      return { ...state, age: action.payload };
    case "HEIGHT_CHANGED":
      return { ...state, height: action.payload };
    case "BODY_FAT_CHANGED":
      return { ...state, bodyFatPercentage: action.payload };
    case "MUSCLE_MASS_CHANGED":
      return { ...state, muscleMassAttr: action.payload };
    case "STEPS_PER_DAY_CHANGED":
      return { ...state, stepsPerDay: action.payload };
    default:
      return state;
  }
};

type StateProviderProps = {
  children?: React.Node
};
type StateProviderState = QueryState & {
  dispatch: Action => void
};
export class StateProvider extends React.Component<
  StateProviderProps,
  StateProviderState
> {
  state = {
    name: "",
    gender: "M",
    weight: 0,
    height: 0,
    bodyFatPercentage: 0,
    muscleMassAttr: "NA",
    age: 0,
    stepsPerDay: 0,
    metric: true,
    base: 0,
    bmr: 0,
    dispatch: (action: Action) => {
      this.setState((state: QueryState) => {
        const newState: QueryState = reducer(state, action);
        saveQueryParams(newState);
        return newState; // force refresh, gross
      });
    }
  };

  static getDerivedStateFromProps = (props: {}, state: StateProviderState) => {
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
const formatValue = (value: number, defaultValue: string | null = null) => {
  if (isNaN(value) || value === 0) {
    return defaultValue || "";
  }
  return String(value);
};
class App extends React.Component<{}, {}> {
  render() {
    return (
      <StateProvider>
        <Context.Consumer>
          {(state: StateProviderState) => (
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
                placeholder="Enter your name"
                value={state.name}
                label="Name"
                onChange={event =>
                  state.dispatch(nameChanged(event.target.value))
                }
              />
              <TextField
                placeholder={`Enter your weight in ${
                  state.metric ? "kg" : "lbs"
                }`}
                value={formatValue(
                  getDisplayWeight(state.metric, state.weight)
                )}
                label="Weight"
                onChange={event =>
                  state.dispatch(
                    weightChanged(state.metric, event.target.value)
                  )
                }
              />
              <TextField
                placeholder="Enter your age"
                value={formatValue(state.age)}
                label="Age"
                onChange={event =>
                  state.dispatch(ageChanged(event.target.value))
                }
              />
              <TextField
                placeholder="Enter your height"
                value={formatValue(
                  getDisplayHeight(state.metric, state.height)
                )}
                label={`Height ${state.metric ? "(cm)" : "(in)"}`}
                onChange={event =>
                  state.dispatch(
                    heightChanged(state.metric, event.target.value)
                  )
                }
              />
              <TextField
                placeholder="Enter your body fat percentage"
                value={formatValue(state.bodyFatPercentage)}
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
                placeholder="Enter your number of average daily steps"
                value={formatValue(state.stepsPerDay, "0")}
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
