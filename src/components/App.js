// @flow
import type { QueryState, GenderType, MassType } from "../utils/StateUtils";

import * as React from "react";
import styled from "styled-components";
import { getStateFromQuery, stateToQueryString } from "../utils/StateUtils";

import MacrosPanel from "./MacrosPanel";
import { CheckBox, CheckBoxOutlineBlank } from "@material-ui/icons";
import TextField from "@material-ui/core/TextField";
import MenuItem from "@material-ui/core/MenuItem";
import Typography from "@material-ui/core/Typography";
import Radio from "@material-ui/core/Radio";
import RadioGroup from "@material-ui/core/RadioGroup";
import Paper from "@material-ui/core/Paper";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import Divider from "@material-ui/core/Divider";

// import grey from "@material-ui/core/colors/grey";

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
  display: flex;
  flex-direction: column;
  align-items: stretch;
  margin: 20px;
  position: relative;
  max-width: 600px;
  width: 100%;
`;

const HeaderContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const MeasurementRadioGroup = styled(RadioGroup)`
  display: flex;
  flex-direction: row !important;
`;

const InputContainer = styled(Paper)`
  padding: 20px;
  display: grid;
  grid-template-columns: 1.8fr 1.2fr;
  grid-template-areas:
    "name weight"
    "gender age"
    "muscle height"
    "bmr fat"
    "bmr activity";
  grid-gap: 20px;
  margin-bottom: 14px;
`;

const BmrContainer = styled.div`
  grid-area: bmr;
  display: flex;
  flex-direction: column;

  .divider {
    margin-bottom: 10px;
  }
`;

const BmrItem = styled(Typography)`
  display: flex !important;
  align-items: center;
  flex-direction: row;
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

const requiredBmrKeys = {
  weight: "Weight",
  age: "Age",
  height: "Height",
  bodyFatPercentage: "Body Fat Percentage"
};

const checkboxStyle = {
  fontSize: 16,
  marginRight: 5
};

const getMissingKeys = state =>
  Object.keys(requiredBmrKeys).filter(
    key => formatValue(state[key]).length === 0
  );

const BmrDisplay = ({ state }) => {
  const missingKeys = getMissingKeys(state);
  const messages = Object.keys(requiredBmrKeys).reduce((messages, key) => {
    let icon = missingKeys.includes(key) ? (
      <CheckBoxOutlineBlank style={checkboxStyle} />
    ) : (
      <CheckBox style={checkboxStyle} />
    );
    messages.push(
      <BmrItem key={key} variant="body1">
        {icon}
        {`Provide your ${requiredBmrKeys[key]}`}
      </BmrItem>
    );
    return messages;
  }, []);

  if (missingKeys.length === 0) {
    return <BmrItem variant="display4">{Math.round(state.bmr)}</BmrItem>;
  } else {
    return messages;
  }
};

type AppState = {
  expansionPanelStates: Set<string>
};

// TODO: Include infomation tooltips that explain each
// TODO: Allow decimals in number inputs
// TODO: Create calendar with checkboxes for if they are training days
class App extends React.Component<{}, AppState> {
  state: AppState = {
    expansionPanelStates: new Set(["cutPanel", "leangainsPanel"])
  };

  handleExpansionChange = (key: string) => (
    event: SyntheticEvent<HTMLButtonElement>,
    expanded: boolean
  ) => {
    const expansionPanelStates = new Set(this.state.expansionPanelStates);
    expanded ? expansionPanelStates.add(key) : expansionPanelStates.delete(key);
    this.setState({
      expansionPanelStates
    });
  };

  render() {
    return (
      <StateProvider>
        <Context.Consumer>
          {(state: StateProviderState) => {
            const showMacros = getMissingKeys(state).length === 0;
            return (
              <AppContainer>
                <HeaderContainer>
                  <div>
                    {" "}
                    <Typography variant="headline" gutterBottom>
                      Leangains Calculator
                    </Typography>
                    <Typography variant="subheading" gutterBottom>
                      Buy the book!
                    </Typography>
                  </div>

                  <MeasurementRadioGroup
                    aria-label="MetricOrImperial"
                    name="measureStandard"
                    value={state.metric ? "1" : "0"}
                    onChange={event =>
                      state.dispatch(
                        standardChanged(Number(event.target.value))
                      )
                    }
                  >
                    {[
                      { label: "Metric", value: "1" },
                      { label: "Imperial", value: "0" }
                    ].map(option => (
                      <FormControlLabel
                        key={option.value}
                        label={option.label}
                        control={<Radio />}
                        value={option.value}
                      />
                    ))}
                  </MeasurementRadioGroup>
                </HeaderContainer>
                <InputContainer>
                  <TextField
                    style={{ gridArea: "name" }}
                    placeholder="Enter your name"
                    value={state.name}
                    label="Name"
                    onChange={event =>
                      state.dispatch(nameChanged(event.target.value))
                    }
                  />
                  <TextField
                    style={{ gridArea: "gender" }}
                    select
                    label="Sex"
                    value={state.gender}
                    onChange={event =>
                      state.dispatch(genderChanged(event.target.value))
                    }
                    helperText="Select your closest biological sex."
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
                    style={{ gridArea: "weight" }}
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
                    style={{ gridArea: "age" }}
                    placeholder="Enter your age"
                    value={formatValue(state.age)}
                    label="Age"
                    onChange={event =>
                      state.dispatch(ageChanged(event.target.value))
                    }
                  />
                  <TextField
                    style={{ gridArea: "height" }}
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
                    style={{ gridArea: "fat" }}
                    placeholder="Enter your body fat percentage"
                    value={formatValue(state.bodyFatPercentage)}
                    label="Body Fat Percentage"
                    onChange={event =>
                      state.dispatch(bodyFatChanged(event.target.value))
                    }
                  />
                  <TextField
                    style={{ gridArea: "muscle" }}
                    select
                    label="Muscle Mass"
                    value={state.muscleMassAttr}
                    onChange={event =>
                      state.dispatch(muscleMassChanged(event.target.value))
                    }
                    helperText="Select your muscle mass"
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
                    style={{ gridArea: "activity" }}
                    placeholder="Enter your number of average daily steps"
                    value={formatValue(state.stepsPerDay, "0")}
                    onChange={event =>
                      state.dispatch(stepsPerDayChanged(event.target.value))
                    }
                    label="Activity Level (Steps per day)"
                  />
                  <BmrContainer>
                    <Divider className="divider" />
                    <Typography variant="title">Maintenance Intake</Typography>
                    <BmrDisplay state={state} />
                    <Typography variant="caption">kcals</Typography>
                  </BmrContainer>
                </InputContainer>
                {showMacros && (
                  <div>
                    <Typography variant="subheading" gutterBottom>
                      Your macros
                    </Typography>
                    <MacrosPanel
                      state={state}
                      title={
                        <span>
                          Standard{" "}
                          <Typography variant="caption">-500 kcal</Typography>
                        </span>
                      }
                      kcalAdjustment={-500}
                      macroAdjustment={0}
                      proteinPercent={60}
                      onChange={this.handleExpansionChange("leangainsPanel")}
                      expanded={this.state.expansionPanelStates.has(
                        "leangainsPanel"
                      )}
                    />
                    <MacrosPanel
                      state={state}
                      title="16:8 (Intermittent Fasting)"
                      kcalAdjustment={-500}
                      macroAdjustment={0}
                      proteinPercent={60}
                      onChange={this.handleExpansionChange("cutPanel")}
                      expanded={this.state.expansionPanelStates.has("cutPanel")}
                    />
                  </div>
                )}
              </AppContainer>
            );
          }}
        </Context.Consumer>
      </StateProvider>
    );
  }
}

export default App;
