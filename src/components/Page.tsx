// @ts-nocheck
import React, { useEffect, useState } from 'react';

import { PageExtensionSDK } from '@contentful/app-sdk';
import { Heading, Paragraph, Button, Pill, Flex, Workbench, Icon } from '@contentful/forma-36-react-components';

// import Collection from './Collection';
import CollectionList from './CollectionList';

interface DashboardProps {
  sdk: PageExtensionSDK;
  // contentTypes: ContentType[];
}

interface CollectionsState {
  total: number | null;
  published: number | null;
  scheduled: number | null;
  recent: any[] | null;
}

export default function Page({ sdk, contentTypes }: DashboardProps) {
  const [data, setData] = useState<CollectionsState>({
    total: null,
    published: null,
    scheduled: null,
    recent: null
  });

  //  TODO Get user tag based on current logged in USER
  //  Use variable when creating new entry
  //  user.spaceMembership.roles // user.tag???
  // const getUserRole = () => {
  //   if (sdk.user.spaceMembership.admin === false ) {

  //   }
  // }

  const userRolesToTagIds = () => {
    const userRoles = sdk.user.spaceMembership.roles // Current logged in user role e.g. "Country: FR" Role

    // Mapping through Role(s)
    return userRoles.map(role => {
      // Converting role name to id. "Country: FR" -> countryFR
      const [roleName, roleCode] = role.name.split(': ');
      const cleanRole = roleName.toLowerCase() + roleCode.substr(0, 1) + roleCode.substr(1).toLowerCase();

      return {
        sys: {
          type: 'Link',
          linkType: 'Tag',
          id: cleanRole,
        }
      };
    })
  }

  const createPost = async () => {
    const newEntry = await sdk.space.createEntry('post', {
      metadata: {
        tags: userRolesToTagIds(sdk.user)
      }
    });
    sdk.navigator.openEntry(newEntry.sys.id);
  }

  useEffect(() => {
    async function fetchData() {
      // Fetch some basic statistics.
      const [total, published, scheduled] = await Promise.all([
        sdk.space
          .getEntries()
          .then((entries) => entries.total)
          .catch(() => 0),
        sdk.space
          .getPublishedEntries()
          .then((entries) => entries.total)
          .catch(() => 0),
        sdk.space
          .getAllScheduledActions()
          .then((entries) => entries.length)
          .catch(() => 0),
      ]);

      // console.log(sdk.user.spaceMembership.roles)

      setData({ ...data, total, published, scheduled });

      // Fetch some entries were last updated by the current user.
      const recent = await sdk.space
        .getEntries({ 'sys.updatedBy.sys.id': sdk.user.sys.id, limit: 10 })
        .then((entries) => entries.items)
        .catch(() => []);

      // Set the final data. Loading complete.
      setData({ total, published, scheduled, recent });
    }

    fetchData();
  }, []);

  return (
    <Workbench id="dashboard">
      <Workbench.Header
        title={'Dashboard'}
        description={`Hello ${sdk.user.firstName}`}
        icon={<Icon icon="Folder" color="primary" />}
        actions={<Button onClick={createPost}>Create Post</Button>}
      />
      <Workbench.Content type="default">
      <Flex className="f36-margin-bottom--l f36-margin-top--s" alignItems="center">
      <Paragraph>{sdk.user.spaceMembership.roles.length >= 2 ? "My User Roles:" : "User Role:"}</Paragraph>
        <div>
          {sdk.user.spaceMembership.roles.length >= 1 && (
          <>
            {sdk.user.spaceMembership.roles.map(role => {
              return (
                <Pill label={role.name} key={role.name} className="f36-margin-right--xs f36-margin-left--xs" />
                )
            })}
          </>
          )}
          {sdk.user.spaceMembership.admin && <Pill className="f36-margin-right--xs f36-margin-left--xs" label="Admin" /> }
        </div>
      </Flex>
      <div className="f36-margin-top--xl">
      <Heading element="h2">Your recent Posts</Heading>
      <Paragraph>These entries were most recently updated by you.</Paragraph>
        <CollectionList
          // contentTypes={contentTypes}
          entries={data.recent}
          onClickItem={(entryId) => sdk.navigator.openEntry(entryId)}
        />
      </div>
      </Workbench.Content>

      {/* <div id="collections">
        <Collection label="Total entries" value={data.total} />
        <Collection label="Published entries" value={data.published} />
        <Collection label="Scheduled entries" value={data.scheduled} />
      </div> */}
    </Workbench>
  );
}
