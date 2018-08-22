// @flow
import type { QueryState } from "../utils/StateUtils";

import * as React from "react";
import styled from "styled-components";
import Typography from "@material-ui/core/Typography";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import ExpansionPanel from "@material-ui/core/ExpansionPanel";
import ExpansionPanelSummary from "@material-ui/core/ExpansionPanelSummary";
import ExpansionPanelDetails from "@material-ui/core/ExpansionPanelDetails";

const nearest = value => Math.round(value * 100) / 100;

type MacrosPanelProps = {
  state: QueryState,
  expanded: boolean,
  onChange: (SyntheticEvent<HTMLButtonElement>, boolean) => void,
  title: React.Node
};

const MacrosPanel = ({
  state,
  expanded,
  onChange,
  title
}: MacrosPanelProps) => {
  return (
    <ExpansionPanel expanded={expanded} onChange={onChange}>
      <ExpansionPanelSummary expandIcon={<ExpandMoreIcon />}>
        <Typography variant="title">{title}</Typography>
      </ExpansionPanelSummary>
      <ExpansionPanelDetails>
        <div />
        <Typography>Training Day {Math.round(state.bmr * 1.0925)}</Typography>
        <Typography>Rest Day {Math.round(state.bmr * 0.925)}</Typography>
      </ExpansionPanelDetails>
    </ExpansionPanel>
  );
};

export default MacrosPanel;
