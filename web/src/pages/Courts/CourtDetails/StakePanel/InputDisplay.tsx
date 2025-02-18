import React, { useState } from "react";
import styled from "styled-components";
import { useParams } from "react-router-dom";
import { formatEther } from "viem";
import { useDebounce } from "react-use";
import { useAccount } from "wagmi";
import { Field } from "@kleros/ui-components-library";
import { useParsedAmount } from "hooks/useParsedAmount";
import { useCourtDetails } from "hooks/queries/useCourtDetails";
import { useKlerosCoreGetJurorBalance, usePnkBalanceOf } from "hooks/contracts/generated";
import StakeWithdrawButton, { ActionType } from "./StakeWithdrawButton";
import { isUndefined } from "utils/index";
import { EnsureChain } from "components/EnsureChain";

const StyledField = styled(Field)`
  width: 100%;
  height: fit-content;
`;

const LabelArea = styled.div`
  display: flex;
  justify-content: space-between;
`;

const StyledLabel = styled.label`
  color: ${({ theme }) => theme.primaryBlue};
  cursor: pointer;
`;

const InputArea = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
`;

interface IInputDisplay {
  action: ActionType;
  isSending: boolean;
  setIsSending: (arg0: boolean) => void;
  setIsPopupOpen: (arg0: boolean) => void;
  amount: string;
  setAmount: (arg0: string) => void;
}

const InputDisplay: React.FC<IInputDisplay> = ({
  action,
  isSending,
  setIsSending,
  setIsPopupOpen,
  amount,
  setAmount,
}) => {
  const [debouncedAmount, setDebouncedAmount] = useState("");
  useDebounce(() => setDebouncedAmount(amount), 500, [amount]);
  const parsedAmount = useParsedAmount(debouncedAmount);

  const { id } = useParams();
  const { data: courtDetails } = useCourtDetails(id);
  const { address } = useAccount();
  const { data: balance } = usePnkBalanceOf({
    enabled: !isUndefined(address),
    args: [address ?? "0x"],
    watch: true,
  });
  const parsedBalance = formatEther(balance ?? 0n);
  const { data: jurorBalance } = useKlerosCoreGetJurorBalance({
    enabled: !isUndefined(address),
    args: [address, id],
    watch: true,
  });
  const parsedStake = formatEther(jurorBalance?.[0] || 0n);
  const isStaking = action === ActionType.stake;

  return (
    <>
      <LabelArea>
        <label>{`Available ${isStaking ? parsedBalance : parsedStake} PNK`}</label>
        <StyledLabel
          onClick={() => {
            const amount = isStaking ? parsedBalance : parsedStake;
            setAmount(amount);
          }}
        >
          {isStaking ? "Stake" : "Withdraw"} all
        </StyledLabel>
      </LabelArea>
      <InputArea>
        <StyledField
          type="number"
          value={amount}
          onChange={(e) => {
            setAmount(e.target.value);
          }}
          placeholder={isStaking ? "Amount to stake" : "Amount to withdraw"}
          message={
            isStaking
              ? `You need to stake at least ${formatEther(courtDetails?.court.minStake ?? 0n)} PNK. ` +
                "You may need two transactions, one to increase allowance, the other to stake."
              : `You need to either withdraw all or keep at least ${formatEther(
                  courtDetails?.court.minStake ?? 0n
                )} PNK.`
          }
          variant="info"
        />
        <EnsureChain>
          <StakeWithdrawButton
            {...{
              parsedAmount,
              action,
              setAmount,
              isSending,
              setIsSending,
              setIsPopupOpen,
            }}
          />
        </EnsureChain>
      </InputArea>
    </>
  );
};

export default InputDisplay;
