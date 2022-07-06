const Web3 = require('web3')
const chai = require('chai')
const assert = chai.assert
const BigNumber = require('bignumber.js')
const { time } = require("@openzeppelin/test-helpers");

const PAStakerSrc = require('../build/contracts/PAStaker.json')
const GenesisTokenSrc = require('../build/contracts/mockGenesis.json')
const C1TokenSrc = require('../build/contracts/mockC1.json')
const PsilocyTokenSrc = require('../build/contracts/mockPsilocybin.json')

const web3 = new Web3(new Web3.providers.HttpProvider('http://127.0.0.1:8545'))
web3.transactionConfirmationBlocks = 1;

function range(start, end) {
  return Array(end - start + 1).fill().map((_, idx) => start + idx)
}

describe('test unstake', function () {

  let PAStaker
  let GenesisToken
  let C1Token
  let PsilocyToken
  let accounts
  

  beforeEach(async() => {
    accounts = await web3.eth.getAccounts()
    GenesisToken = new web3.eth.Contract(GenesisTokenSrc.abi)
    C1Token = new web3.eth.Contract(C1TokenSrc.abi)
    PsilocyToken = new web3.eth.Contract(C1TokenSrc.abi)
    PAStaker = new web3.eth.Contract(PAStakerSrc.abi)
    

    // let args = [200, 300, 1000, 1500, 2000, 5000, accounts[1], accounts[2], accounts[3], accounts[4], accounts[5], accounts[6]]

    GenesisToken = await GenesisToken.deploy({data: GenesisTokenSrc.bytecode}).send({from: accounts[0], gas: 10000000})
    C1Token = await C1Token.deploy({data: C1TokenSrc.bytecode}).send({from: accounts[0], gas: 10000000})
    PsilocyToken = await PsilocyToken.deploy({data: PsilocyTokenSrc.bytecode}).send({from: accounts[0], gas: 10000000})
    let stakerArgs = [GenesisToken.options.address, C1Token.options.address, PsilocyToken.options.address]
    PAStaker = await PAStaker.deploy({data: PAStakerSrc.bytecode, arguments: stakerArgs}).send({from: accounts[0], gas: 10000000})

    let j = 1
    while(j < 10) { // mint 10 tokens to accounts 1 through 9
      await GenesisToken.methods.mint(10).send({from: accounts[j], gas:10000000});
      await C1Token.methods.mint(10).send({from: accounts[j], gas:10000000});
      await PsilocyToken.methods.mint(10).send({from: accounts[j], gas:10000000});
      j++
    }
    
    let i = 0;
    while(i < 10) { // set approval for all accounts
      await GenesisToken.methods.setApprovalForAll(PAStaker.options.address, true).send({from: accounts[i], gas:10000000});
      await C1Token.methods.setApprovalForAll(PAStaker.options.address, true).send({from: accounts[i], gas:10000000});
      await PsilocyToken.methods.setApprovalForAll(PAStaker.options.address, true).send({from: accounts[i], gas:10000000});
      i++
    }
    
  })

  it('batch unstake genesis and check the getters', async() => {
    let tokenIds = range(1, 10)
    await PAStaker.methods.batchStake(tokenIds, 0).send({from: accounts[1], gas:10000000});
    await PAStaker.methods.batchUnstake(tokenIds, 0).send({from: accounts[1], gas:10000000});

    for(let i = 1; i <= 10; i++) {
      let isStaked = await PAStaker.methods.isStaked(accounts[1], 0, i).call();
      assert(isStaked == false, "is staked: failed to unstake stake on ID: " + i);
    }

    let stakedBalance = await PAStaker.methods.stakedBalance(accounts[1], 0).call();
    assert.equal(stakedBalance, 0);

    let stakedTokens = await PAStaker.methods.getStakedTokens(accounts[1], 0).call();
    assert.equal(undefined, stakedTokens[0])

    for(let i = 1; i <= 10; i++) {
      let ownerOfToken = await GenesisToken.methods.ownerOf(i).call();
      assert(ownerOfToken == accounts[1], "is staked: failed to unstake on ID: " + i);
    }

    await time.increase(100000);

    for(let i = 1; i <= 10; i++) {
      let timeSinceStaked = await PAStaker.methods.timeSinceStaked(0, i).call();
      console.log(timeSinceStaked)
      assert(timeSinceStaked == 0, "Time since staked: failed track time on token id: " + i);
    }
  })

  it('batch unstake c1 and check the getters', async() => {
    let tokenIds = range(1, 10)
    await PAStaker.methods.batchStake(tokenIds, 1).send({from: accounts[1], gas:10000000});
    await PAStaker.methods.batchUnstake(tokenIds, 1).send({from: accounts[1], gas:10000000});

    for(let i = 1; i <= 10; i++) {
      let isStaked = await PAStaker.methods.isStaked(accounts[1], 1, i).call();
      assert(isStaked == false, "is staked: failed to unstake stake on ID: " + i);
    }

    let stakedBalance = await PAStaker.methods.stakedBalance(accounts[1], 1).call();
    assert.equal(stakedBalance, 0);

    let stakedTokens = await PAStaker.methods.getStakedTokens(accounts[1], 1).call();
    assert.equal(undefined, stakedTokens[0])

    for(let i = 1; i <= 10; i++) {
      let ownerOfToken = await C1Token.methods.ownerOf(i).call();
      assert(ownerOfToken == accounts[1], "is staked: failed to unstake on ID: " + i);
    }

    await time.increase(100000);

    for(let i = 1; i <= 10; i++) {
      let timeSinceStaked = await PAStaker.methods.timeSinceStaked(1, i).call();
      console.log(timeSinceStaked)
      assert(timeSinceStaked == 0, "Time since staked: failed track time on token id: " + i);
    }
  })

  it('batch unstake psilocy and check the getters', async() => {
    let tokenIds = range(1, 10)
    await PAStaker.methods.batchStake(tokenIds, 2).send({from: accounts[1], gas:10000000});
    await PAStaker.methods.batchUnstake(tokenIds, 2).send({from: accounts[1], gas:10000000});

    for(let i = 1; i <= 10; i++) {
      let isStaked = await PAStaker.methods.isStaked(accounts[1], 2, i).call();
      assert(isStaked == false, "is staked: failed to unstake stake on ID: " + i);
    }

    let stakedBalance = await PAStaker.methods.stakedBalance(accounts[1], 2).call();
    assert.equal(stakedBalance, 0);

    let stakedTokens = await PAStaker.methods.getStakedTokens(accounts[1], 2).call();
    assert.equal(undefined, stakedTokens[0])

    for(let i = 1; i <= 10; i++) {
      let ownerOfToken = await PsilocyToken.methods.ownerOf(i).call();
      assert(ownerOfToken == accounts[1], "is staked: failed to unstake on ID: " + i);
    }

    await time.increase(100000);

    for(let i = 1; i <= 10; i++) {
      let timeSinceStaked = await PAStaker.methods.timeSinceStaked(2, i).call();
      console.log(timeSinceStaked)
      assert(timeSinceStaked == 0, "Time since staked: failed track time on token id: " + i);
    }
  })

  it('unstake genesis and check the getters', async() => {
    await GenesisToken.methods.safeTransferFrom(accounts[1], PAStaker.options.address, 1).send({from: accounts[1], gas:10000000});
    await PAStaker.methods.unstake(1, 0).send({from: accounts[1], gas:10000000});

    let isStaked = await PAStaker.methods.isStaked(accounts[1], 0, 1).call();
    assert(isStaked == false, "is staked: failed to stake");

    let stakedBalance = await PAStaker.methods.stakedBalance(accounts[1], 0).call();
    assert.equal(stakedBalance, 0);

    let stakedTokens = await PAStaker.methods.getStakedTokens(accounts[1], 0).call();
    assert.equal(undefined, stakedTokens[0])

    let ownerOfToken = await GenesisToken.methods.ownerOf(1).call();
    assert(ownerOfToken == accounts[1], "is staked: failed to stake");
    
    await time.increase(100000);

    let timeSinceStaked = await PAStaker.methods.timeSinceStaked(0, 1).call();
    assert(timeSinceStaked == 0, "Time since staked: failed track time");
  })

  it('unstake C1 and check the getters', async() => {
    await C1Token.methods.safeTransferFrom(accounts[1], PAStaker.options.address, 1).send({from: accounts[1], gas:10000000});
    await PAStaker.methods.unstake(1, 1).send({from: accounts[1], gas:10000000});

    let isStaked = await PAStaker.methods.isStaked(accounts[1], 1, 1).call();
    assert(isStaked == false, "is staked: failed to stake");

    let stakedBalance = await PAStaker.methods.stakedBalance(accounts[1], 1).call();
    assert.equal(stakedBalance, 0);

    let stakedTokens = await PAStaker.methods.getStakedTokens(accounts[1], 1).call();
    assert.equal(undefined, stakedTokens[0])

    let ownerOfToken = await C1Token.methods.ownerOf(1).call();
    assert(ownerOfToken == accounts[1], "is staked: failed to stake");
    
    await time.increase(100000);

    let timeSinceStaked = await PAStaker.methods.timeSinceStaked(1, 1).call();
    assert(timeSinceStaked == 0, "Time since staked: failed track time");
  })

  it('unstake Psilocy and check the getters', async() => {
    await PsilocyToken.methods.safeTransferFrom(accounts[1], PAStaker.options.address, 1).send({from: accounts[1], gas:10000000});
    await PAStaker.methods.unstake(1, 2).send({from: accounts[1], gas:10000000});

    let isStaked = await PAStaker.methods.isStaked(accounts[1], 2, 1).call();
    assert(isStaked == false, "is staked: failed to stake");

    let stakedBalance = await PAStaker.methods.stakedBalance(accounts[1], 2).call();
    assert.equal(stakedBalance, 0);

    let stakedTokens = await PAStaker.methods.getStakedTokens(accounts[1], 2).call();
    assert.equal(undefined, stakedTokens[0])

    let ownerOfToken = await PsilocyToken.methods.ownerOf(1).call();
    assert(ownerOfToken == accounts[1], "is staked: failed to stake");
    
    await time.increase(100000);

    let timeSinceStaked = await PAStaker.methods.timeSinceStaked(2, 1).call();
    assert(timeSinceStaked == 0, "Time since staked: failed track time");
  })

  it('unstake genesis and check the getters - delegated single', async() => {
    await GenesisToken.methods.safeTransferFrom(accounts[1], PAStaker.options.address, 1).send({from: accounts[1], gas:10000000});
    await PAStaker.methods.delegatedUnstake(1, 0).send({from: accounts[0], gas:10000000});

    let isStaked = await PAStaker.methods.isStaked(accounts[1], 0, 1).call();
    assert(isStaked == false, "is staked: failed to stake");

    let stakedBalance = await PAStaker.methods.stakedBalance(accounts[1], 0).call();
    assert.equal(stakedBalance, 0);

    let stakedTokens = await PAStaker.methods.getStakedTokens(accounts[1], 0).call();
    assert.equal(undefined, stakedTokens[0])

    let ownerOfToken = await GenesisToken.methods.ownerOf(1).call();
    assert(ownerOfToken == accounts[1], "is staked: failed to stake");
    
    await time.increase(100000);

    let timeSinceStaked = await PAStaker.methods.timeSinceStaked(0, 1).call();
    assert(timeSinceStaked == 0, "Time since staked: failed track time");
  })

  it('unstake C1 and check the getters - delegated single', async() => {
    await C1Token.methods.safeTransferFrom(accounts[1], PAStaker.options.address, 1).send({from: accounts[1], gas:10000000});
    await PAStaker.methods.delegatedUnstake(1, 1).send({from: accounts[0], gas:10000000});
    
    let isStaked = await PAStaker.methods.isStaked(accounts[1], 1, 1).call();
    assert(isStaked == false, "is staked: failed to stake");

    let stakedBalance = await PAStaker.methods.stakedBalance(accounts[1], 1).call();
    assert.equal(stakedBalance, 0);

    let stakedTokens = await PAStaker.methods.getStakedTokens(accounts[1], 1).call();
    assert.equal(undefined, stakedTokens[0])

    let ownerOfToken = await C1Token.methods.ownerOf(1).call();
    assert(ownerOfToken == accounts[1], "is staked: failed to stake");
    
    await time.increase(100000);

    let timeSinceStaked = await PAStaker.methods.timeSinceStaked(1, 1).call();
    assert(timeSinceStaked == 0, "Time since staked: failed track time");
  })

  it('unstake Psilocy and check the getters - delegated single', async() => {
    await PsilocyToken.methods.safeTransferFrom(accounts[1], PAStaker.options.address, 1).send({from: accounts[1], gas:10000000});
    await PAStaker.methods.delegatedUnstake(1, 2).send({from: accounts[0], gas:10000000});

    let isStaked = await PAStaker.methods.isStaked(accounts[1], 2, 1).call();
    assert(isStaked == false, "is staked: failed to stake");

    let stakedBalance = await PAStaker.methods.stakedBalance(accounts[1], 2).call();
    assert.equal(stakedBalance, 0);

    let stakedTokens = await PAStaker.methods.getStakedTokens(accounts[1], 2).call();
    assert.equal(undefined, stakedTokens[0])

    let ownerOfToken = await PsilocyToken.methods.ownerOf(1).call();
    assert(ownerOfToken == accounts[1], "is staked: failed to stake");
    
    await time.increase(100000);

    let timeSinceStaked = await PAStaker.methods.timeSinceStaked(2, 1).call();
    assert(timeSinceStaked == 0, "Time since staked: failed track time");
  })

  it('batch unstake genesis - delegated batch', async() => {
    let contractId = 0;

    let tokenIds1 = range(1, 10)
    await PAStaker.methods.batchStake(tokenIds1, contractId).send({from: accounts[1], gas:10000000});
    let tokenIds2 = range(11, 20)
    await PAStaker.methods.batchStake(tokenIds2, contractId).send({from: accounts[2], gas:10000000});
    let tokenIds3 = range(21, 30)
    await PAStaker.methods.batchStake(tokenIds3, contractId).send({from: accounts[3], gas:10000000});
    await PAStaker.methods.delegatedBatchUnstake(range(1,30), contractId).send({from: accounts[0], gas:10000000});

    let isStaked
    for(let i = 1; i <= 10; i++) {
      isStaked = await PAStaker.methods.isStaked(accounts[1], contractId, i).call();
      assert(isStaked == false, "is staked: failed to unstake stake on ID: " + i);
      isStaked = await PAStaker.methods.isStaked(accounts[2], contractId, i).call();
      assert(isStaked == false, "is staked: failed to unstake stake on ID: " + i);
      isStaked = await PAStaker.methods.isStaked(accounts[3], contractId, i).call();
      assert(isStaked == false, "is staked: failed to unstake stake on ID: " + i);
    }

    let stakedBalance
    stakedBalance = await PAStaker.methods.stakedBalance(accounts[1], contractId).call();
    assert.equal(stakedBalance, 0);
    stakedBalance = await PAStaker.methods.stakedBalance(accounts[2], contractId).call();
    assert.equal(stakedBalance, 0);
    stakedBalance = await PAStaker.methods.stakedBalance(accounts[3], contractId).call();
    assert.equal(stakedBalance, 0);

    let stakedTokens
    stakedTokens = await PAStaker.methods.getStakedTokens(accounts[1], contractId).call();
    assert.equal(undefined, stakedTokens[0])
    stakedTokens = await PAStaker.methods.getStakedTokens(accounts[2], contractId).call();
    assert.equal(undefined, stakedTokens[0])
    stakedTokens = await PAStaker.methods.getStakedTokens(accounts[3], contractId).call();
    assert.equal(undefined, stakedTokens[0])

    let ownerOfToken
    for(let i = 1; i <= 10; i++) {
      ownerOfToken = await GenesisToken.methods.ownerOf(i).call();
      assert(ownerOfToken == accounts[1], "is staked: failed to unstake on ID: " + i);
      ownerOfToken = await GenesisToken.methods.ownerOf(i + 10).call();
      assert(ownerOfToken == accounts[2], "is staked: failed to unstake on ID: " + (i + 10));
      ownerOfToken = await GenesisToken.methods.ownerOf(i + 20).call();
      assert(ownerOfToken == accounts[3], "is staked: failed to unstake on ID: " + (i + 20));
    }

    await time.increase(100000);

    let timeSinceStaked
    for(let i = 1; i <= 30; i++) {
      timeSinceStaked = await PAStaker.methods.timeSinceStaked(contractId, i).call();
      assert(timeSinceStaked == 0, "Time since staked: failed track time on token id: " + i);
    }
  })

  it('batch unstake c1 - delegated batch', async() => {
    let contractId = 1;

    let tokenIds1 = range(1, 10)
    await PAStaker.methods.batchStake(tokenIds1, contractId).send({from: accounts[1], gas:10000000});
    let tokenIds2 = range(11, 20)
    await PAStaker.methods.batchStake(tokenIds2, contractId).send({from: accounts[2], gas:10000000});
    let tokenIds3 = range(21, 30)
    await PAStaker.methods.batchStake(tokenIds3, contractId).send({from: accounts[3], gas:10000000});
    await PAStaker.methods.delegatedBatchUnstake(range(1,30), contractId).send({from: accounts[0], gas:10000000});

    let isStaked
    for(let i = 1; i <= 10; i++) {
      isStaked = await PAStaker.methods.isStaked(accounts[1], contractId, i).call();
      assert(isStaked == false, "is staked: failed to unstake stake on ID: " + i);
      isStaked = await PAStaker.methods.isStaked(accounts[2], contractId, i).call();
      assert(isStaked == false, "is staked: failed to unstake stake on ID: " + i);
      isStaked = await PAStaker.methods.isStaked(accounts[3], contractId, i).call();
      assert(isStaked == false, "is staked: failed to unstake stake on ID: " + i);
    }

    let stakedBalance
    stakedBalance = await PAStaker.methods.stakedBalance(accounts[1], contractId).call();
    assert.equal(stakedBalance, 0);
    stakedBalance = await PAStaker.methods.stakedBalance(accounts[2], contractId).call();
    assert.equal(stakedBalance, 0);
    stakedBalance = await PAStaker.methods.stakedBalance(accounts[3], contractId).call();
    assert.equal(stakedBalance, 0);

    let stakedTokens
    stakedTokens = await PAStaker.methods.getStakedTokens(accounts[1], contractId).call();
    assert.equal(undefined, stakedTokens[0])
    stakedTokens = await PAStaker.methods.getStakedTokens(accounts[2], contractId).call();
    assert.equal(undefined, stakedTokens[0])
    stakedTokens = await PAStaker.methods.getStakedTokens(accounts[3], contractId).call();
    assert.equal(undefined, stakedTokens[0])

    let ownerOfToken
    for(let i = 1; i <= 10; i++) {
      ownerOfToken = await C1Token.methods.ownerOf(i).call();
      assert(ownerOfToken == accounts[1], "is staked: failed to unstake on ID: " + i);
      ownerOfToken = await C1Token.methods.ownerOf(i + 10).call();
      assert(ownerOfToken == accounts[2], "is staked: failed to unstake on ID: " + (i + 10));
      ownerOfToken = await C1Token.methods.ownerOf(i + 20).call();
      assert(ownerOfToken == accounts[3], "is staked: failed to unstake on ID: " + (i + 20));
    }

    await time.increase(100000);

    let timeSinceStaked
    for(let i = 1; i <= 30; i++) {
      timeSinceStaked = await PAStaker.methods.timeSinceStaked(contractId, i).call();
      assert(timeSinceStaked == 0, "Time since staked: failed track time on token id: " + i);
    }
  })

  it('batch unstake Psilocy - delegated batch', async() => {
    let contractId = 1;

    let tokenIds1 = range(1, 10)
    await PAStaker.methods.batchStake(tokenIds1, contractId).send({from: accounts[1], gas:10000000});
    let tokenIds2 = range(11, 20)
    await PAStaker.methods.batchStake(tokenIds2, contractId).send({from: accounts[2], gas:10000000});
    let tokenIds3 = range(21, 30)
    await PAStaker.methods.batchStake(tokenIds3, contractId).send({from: accounts[3], gas:10000000});
    await PAStaker.methods.delegatedBatchUnstake(range(1,30), contractId).send({from: accounts[0], gas:10000000});

    let isStaked
    for(let i = 1; i <= 10; i++) {
      isStaked = await PAStaker.methods.isStaked(accounts[1], contractId, i).call();
      assert(isStaked == false, "is staked: failed to unstake stake on ID: " + i);
      isStaked = await PAStaker.methods.isStaked(accounts[2], contractId, i).call();
      assert(isStaked == false, "is staked: failed to unstake stake on ID: " + i);
      isStaked = await PAStaker.methods.isStaked(accounts[3], contractId, i).call();
      assert(isStaked == false, "is staked: failed to unstake stake on ID: " + i);
    }

    let stakedBalance
    stakedBalance = await PAStaker.methods.stakedBalance(accounts[1], contractId).call();
    assert.equal(stakedBalance, 0);
    stakedBalance = await PAStaker.methods.stakedBalance(accounts[2], contractId).call();
    assert.equal(stakedBalance, 0);
    stakedBalance = await PAStaker.methods.stakedBalance(accounts[3], contractId).call();
    assert.equal(stakedBalance, 0);

    let stakedTokens
    stakedTokens = await PAStaker.methods.getStakedTokens(accounts[1], contractId).call();
    assert.equal(undefined, stakedTokens[0])
    stakedTokens = await PAStaker.methods.getStakedTokens(accounts[2], contractId).call();
    assert.equal(undefined, stakedTokens[0])
    stakedTokens = await PAStaker.methods.getStakedTokens(accounts[3], contractId).call();
    assert.equal(undefined, stakedTokens[0])

    let ownerOfToken
    for(let i = 1; i <= 10; i++) {
      ownerOfToken = await PsilocyToken.methods.ownerOf(i).call();
      assert(ownerOfToken == accounts[1], "is staked: failed to unstake on ID: " + i);
      ownerOfToken = await PsilocyToken.methods.ownerOf(i + 10).call();
      assert(ownerOfToken == accounts[2], "is staked: failed to unstake on ID: " + (i + 10));
      ownerOfToken = await PsilocyToken.methods.ownerOf(i + 20).call();
      assert(ownerOfToken == accounts[3], "is staked: failed to unstake on ID: " + (i + 20));
    }

    await time.increase(100000);

    let timeSinceStaked
    for(let i = 1; i <= 30; i++) {
      timeSinceStaked = await PAStaker.methods.timeSinceStaked(contractId, i).call();
      assert(timeSinceStaked == 0, "Time since staked: failed track time on token id: " + i);
    }
  })

  
})