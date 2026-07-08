import { useState, useEffect, useCallback } from "react";
import {
  getTeams,
  getTeam,
  createTeam,
  updateTeamById,
  deleteTeamById,
  getPlayers,
  createPlayer,
  updatePlayerById,
  deletePlayerById,
  onStoreChange,
} from "./local-store";
import type { Team, Player, TeamInput, PlayerInput } from "./local-store";

export type { Team, Player, TeamInput, PlayerInput };

type MutateCallbacks = { onSuccess?: () => void; onError?: () => void };

function useMutation<TArgs>(fn: (args: TArgs) => void) {
  const mutate = useCallback(
    (args: TArgs, cbs?: MutateCallbacks) => {
      try {
        fn(args);
        cbs?.onSuccess?.();
      } catch {
        cbs?.onError?.();
      }
    },
    [fn],
  );
  return { mutate, isPending: false as const };
}

function useStoreValue<T>(read: () => T): T {
  const [val, setVal] = useState<T>(read);
  useEffect(() => {
    return onStoreChange(() => setVal(read()));
  }, [read]);
  return val;
}

export function useListTeams() {
  const read = useCallback(() => getTeams(), []);
  const data = useStoreValue(read);
  return { data, isLoading: false as const };
}

export function useGetTeam(id: number) {
  const read = useCallback(() => getTeam(id), [id]);
  const data = useStoreValue(read);
  return { data, isLoading: false as const };
}

export function useListTeamPlayers(teamId: number) {
  const read = useCallback(
    () => (teamId ? getPlayers(teamId) : []),
    [teamId],
  );
  const data = useStoreValue(read);
  return { data, isLoading: false as const };
}

export function useCreateTeam() {
  return useMutation(({ data }: { data: TeamInput }) => createTeam(data));
}

export function useUpdateTeam() {
  return useMutation(
    ({ id, data }: { id: number; data: TeamInput }) => updateTeamById(id, data),
  );
}

export function useDeleteTeam() {
  return useMutation(({ id }: { id: number }) => deleteTeamById(id));
}

export function useCreatePlayer() {
  return useMutation(({ data }: { data: PlayerInput }) => createPlayer(data));
}

export function useUpdatePlayer() {
  return useMutation(
    ({ id, data }: { id: number; data: PlayerInput }) =>
      updatePlayerById(id, data),
  );
}

export function useDeletePlayer() {
  return useMutation(({ id }: { id: number }) => deletePlayerById(id));
}
