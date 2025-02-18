import React from "react";
import styled, { Theme } from "styled-components";
import { Periods } from "consts/periods";

export interface IPeriodBanner {
  id: number;
  period: Periods;
}

const getPeriodColors = (period: Periods, theme: Theme): [string, string] => {
  switch (period) {
    case Periods.appeal:
      return [theme.tint, theme.tintMedium];
    case Periods.execution:
      return [theme.secondaryPurple, theme.mediumPurple];
    default:
      return [theme.primaryBlue, theme.mediumBlue];
  }
};

const Container = styled.div<Omit<IPeriodBanner, "id">>`
  height: 45px;
  width: auto;
  border-top-right-radius: 3px;
  border-top-left-radius: 3px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  .dot {
    ::before {
      content: "";
      display: inline-block;
      height: 8px;
      width: 8px;
      border-radius: 50%;
      margin-right: 8px;
    }
  }
  ${({ theme, period }) => {
    const [frontColor, backgroundColor] = getPeriodColors(period, theme);
    return `
      border-top: 5px solid ${frontColor};
      background-color: ${backgroundColor};
      .front-color {
        color: ${frontColor};
      }
      .dot {
        ::before {
          background-color: ${frontColor};
        }
      }
    `;
  }};
`;

const getPeriodLabel = (period: Periods): string => {
  switch (period) {
    case Periods.appeal:
      return "Crowdfunding Appeal";
    case Periods.execution:
      return "Closed";
    default:
      return "In Progress";
  }
};

const PeriodBanner: React.FC<IPeriodBanner> = ({ id, period }) => (
  <Container {...{ period }}>
    <label className="front-color dot">{getPeriodLabel(period)}</label>
    <label className="front-color">#{id}</label>
  </Container>
);

export default PeriodBanner;
