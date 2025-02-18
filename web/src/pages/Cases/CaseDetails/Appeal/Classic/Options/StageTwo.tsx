import React, { useEffect } from "react";
import styled from "styled-components";
import OptionCard from "../../OptionCard";
import { useFundingContext, useOptionsContext, useSelectedOptionContext } from "hooks/useClassicAppealContext";
import { isUndefined } from "utils/index";

const StageOne: React.FC = () => {
  const { paidFees, winningChoice, winnerRequiredFunding, fundedChoices } = useFundingContext();
  const options = useOptionsContext();
  const { selectedOption, setSelectedOption } = useSelectedOptionContext();
  useEffect(() => {
    if (!isUndefined(winningChoice)) setSelectedOption(parseInt(winningChoice));
  });
  return (
    <Container>
      {!isUndefined(winningChoice) &&
      !isUndefined(fundedChoices) &&
      !isUndefined(paidFees) &&
      fundedChoices.length > 0 &&
      !fundedChoices.includes(winningChoice) ? (
        <>
          <label>Loser deadline has finalized, you can only fund the current winner.</label>
          <OptionsContainer>
            <OptionCard
              text={options![winningChoice!]}
              selected={winningChoice === selectedOption}
              winner={true}
              funding={paidFees![winningChoice!] ? BigInt(paidFees![winningChoice!]) : 0n}
              required={winnerRequiredFunding!}
              canBeSelected={false}
              onClick={() => setSelectedOption(parseInt(winningChoice!, 10))}
            />
          </OptionsContainer>
        </>
      ) : (
        <label>No losing option has been funded in time, winner is maintained.</label>
      )}
    </Container>
  );
};

const Container = styled.div`
  margin: 24px 0;
`;

const OptionsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 24px;
  margin-top: 12px;
`;

export default StageOne;
