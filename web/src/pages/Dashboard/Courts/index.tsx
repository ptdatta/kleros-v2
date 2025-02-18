import React from "react";
import styled from "styled-components";
import { useAccount } from "wagmi";
import { isUndefined } from "utils/index";
import CourtCard from "./CourtCard";
import { useUserQuery } from "queries/useUser";

const Container = styled.div`
  margin-top: 64px;
`;

const CourtsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Courts: React.FC = () => {
  const { address } = useAccount();
  const { data } = useUserQuery(address?.toLowerCase());

  return (
    <>
      {!isUndefined(data) && (
        <Container>
          <h1> My Courts </h1>
          <hr />
          <CourtsContainer>
            {data.user?.tokens?.map(({ court: { id, name } }) => {
              return <CourtCard key={id} id={id} name={name ?? ""} />;
            })}
          </CourtsContainer>
        </Container>
      )}
    </>
  );
};

export default Courts;
